import { useState, useRef, useEffect } from 'react'
import { Send, Bot } from 'lucide-react'
import { useAccounts } from '@/hooks/useAccounts'
import { useTransactions } from '@/hooks/useTransactions'
import { parseCommand, findAccount, formatCurrency } from '@/services/chatParser'

// ─── Static content ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'desconte 300 do porquinho do Inter',
  'adicione 1500 na carteira principal',
  'quanto tenho no total?',
  'desfazer',
]

const WELCOME = {
  id: 0,
  role: 'assistant',
  ts: Date.now(),
  text:
    'Olá! Sou o assistente do GranInhA 🐷\n\n' +
    'Diga o que quer fazer em linguagem natural:\n\n' +
    '• "desconte 300 do porquinho do Inter"\n' +
    '• "adicione 500 na carteira principal"\n' +
    '• "recebi 2000 no cartão Nubank"\n' +
    '• "quanto tenho no total?"\n' +
    '• "desfazer" — reverte a última transação desta sessão',
}

// ─── Response builders ───────────────────────────────────────────────────────

const HELP_TEXT =
  'Não entendi esse comando 🤔\n\n' +
  'Tente algo como:\n' +
  '• "desconte 50 do porquinho do Inter"\n' +
  '• "adicione 200 na carteira principal"\n' +
  '• "gastei 30" (se tiver só uma conta)\n' +
  '• "quanto tenho no total?"\n' +
  '• "desfazer"'

function noAccountText(name, accounts) {
  const list = accounts.map(a => `• ${a.name}`).join('\n')
  return `Não encontrei nenhuma conta chamada "${name}".\n\nSuas contas:\n${list}\n\nQual você quis dizer?`
}

function ambiguousText(candidates) {
  const list = candidates.map(a => `• ${a.name}`).join('\n')
  return `Encontrei mais de uma conta parecida:\n\n${list}\n\nQual delas você quer usar? (Digite o nome completo)`
}

function askAccountText(accounts) {
  const list = accounts.map(a => `• ${a.name}`).join('\n')
  return `Para qual conta?\n\n${list}\n\nDigite o nome da conta.`
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Chat() {
  const { accounts, totalBalance } = useAccounts()
  const { createTransaction, deleteTransaction } = useTransactions()

  const [messages,   setMessages]   = useState([WELCOME])
  const [input,      setInput]      = useState('')
  const [thinking,   setThinking]   = useState(false)
  const [pendingCmd, setPendingCmd] = useState(null) // { type, amount, originalText }

  const lastChatTxRef = useRef(null)  // { id, type, accountId, amount } — for undo
  const bottomRef     = useRef(null)

  // Auto-scroll on every new message or thinking state change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  // ── Message helpers ──────────────────────────────────────────────────────

  function pushMsg(role, text) {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), role, text, ts: Date.now() }])
  }

  // ── Core command processor ───────────────────────────────────────────────

  async function processMessage(text) {
    const cmd = parseCommand(text)

    // ── Undo ──
    if (cmd.action === 'undo') {
      if (!lastChatTxRef.current) {
        return 'Não há transação recente para desfazer nesta sessão.'
      }
      const tx = lastChatTxRef.current
      await deleteTransaction(tx)
      lastChatTxRef.current = null
      const verb = tx.type === 'income' ? 'entrada' : 'saída'
      return `↩️ Feito! Desfiz a ${verb} de ${formatCurrency(tx.amount)}.`
    }

    // ── Pending command: waiting for account selection ──
    if (pendingCmd) {
      const { match, multiple, candidates } = findAccount(accounts, text)
      if (match) {
        const reply = await executeAndFormat(pendingCmd.type, match, pendingCmd.amount, pendingCmd.originalText)
        setPendingCmd(null)
        return reply
      }
      if (multiple) return ambiguousText(candidates)
      // Doesn't look like an account — clear pending state and fall through
      setPendingCmd(null)
    }

    // ── Balance query ──
    if (cmd.action === 'balance') {
      if (!cmd.accountName) {
        return `💰 Saldo total: ${formatCurrency(totalBalance)}`
      }
      const { match, multiple, candidates } = findAccount(accounts, cmd.accountName)
      if (!match && !multiple) return noAccountText(cmd.accountName, accounts)
      if (multiple) return ambiguousText(candidates)
      return `💰 ${match.name}: ${formatCurrency(match.balance ?? 0)}`
    }

    // ── Transaction: add or deduct ──
    if (cmd.action === 'add' || cmd.action === 'deduct') {
      const type = cmd.action === 'add' ? 'income' : 'expense'

      if (accounts.length === 0) {
        return '❌ Você não tem nenhuma conta criada. Vá em Contas para criar uma!'
      }

      // No account mentioned in the command
      if (!cmd.accountName) {
        if (accounts.length === 1) {
          return await executeAndFormat(type, accounts[0], cmd.amount, text)
        }
        setPendingCmd({ type, amount: cmd.amount, originalText: text })
        return askAccountText(accounts)
      }

      const { match, multiple, candidates } = findAccount(accounts, cmd.accountName)

      if (!match && !multiple) return noAccountText(cmd.accountName, accounts)

      if (multiple) {
        setPendingCmd({ type, amount: cmd.amount, originalText: text })
        return ambiguousText(candidates)
      }

      return await executeAndFormat(type, match, cmd.amount, text)
    }

    // ── Unknown ──
    return HELP_TEXT
  }

  async function executeAndFormat(type, account, amount, originalText) {
    const created = await createTransaction({
      type,
      accountId:   account.id,
      amount,
      description: originalText,
      date:        new Date().toISOString(),
    })

    lastChatTxRef.current = created

    const delta      = type === 'income' ? amount : -amount
    const newBalance = (account.balance ?? 0) + delta
    const verb       = type === 'income' ? 'Adicionei' : 'Descontei'
    const prep       = type === 'income' ? 'em' : 'de'

    return `✅ ${verb} ${formatCurrency(amount)} ${prep} ${account.name}.\nNovo saldo: ${formatCurrency(newBalance)}`
  }

  // ── Send handler ─────────────────────────────────────────────────────────

  async function handleSend(text) {
    const raw = (text ?? input).trim()
    if (!raw || thinking) return
    setInput('')
    pushMsg('user', raw)
    setThinking(true)
    try {
      const reply = await processMessage(raw)
      pushMsg('assistant', reply)
    } catch (err) {
      console.error('Chat error:', err)
      pushMsg('assistant', `❌ Algo deu errado: ${err.message ?? 'Tente novamente.'}`)
    } finally {
      setThinking(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const showSuggestions = messages.length === 1  // only welcome message

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100dvh-7rem)] md:h-[calc(100dvh-3rem)] animate-fade-in">
      {/* Header */}
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold">Chat</h1>
        <p className="text-slate-400 text-sm mt-1">Gerencie suas finanças com linguagem natural</p>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {thinking && <ThinkingBubble />}

        {/* Anchor for auto-scroll */}
        <div ref={bottomRef} />
      </div>

      {/* Bottom area */}
      <div className="shrink-0 space-y-2 pt-2">
        {showSuggestions && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(cmd => (
              <button
                key={cmd}
                onClick={() => handleSend(cmd)}
                disabled={thinking}
                className="text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 px-3 py-1.5 rounded-full transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            className="input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={thinking}
            placeholder="Ex: desconte 300 do porquinho do Inter..."
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || thinking}
            className="btn-primary flex items-center justify-center w-11 shrink-0"
            aria-label="Enviar"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="bg-brand-600/20 rounded-full p-1.5 h-8 w-8 flex items-center justify-center shrink-0 mt-0.5">
          <Bot size={15} className="text-brand-400" />
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
            isUser
              ? 'bg-brand-600 text-white rounded-tr-sm'
              : 'bg-slate-800 text-slate-100 rounded-tl-sm'
          }`}
        >
          {msg.text}
        </div>
        <span className="text-[10px] text-slate-600 px-1">
          {new Date(msg.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

function ThinkingBubble() {
  return (
    <div className="flex gap-2.5">
      <div className="bg-brand-600/20 rounded-full p-1.5 h-8 w-8 flex items-center justify-center shrink-0">
        <Bot size={15} className="text-brand-400" />
      </div>
      <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3.5">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
