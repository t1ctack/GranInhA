import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, Bot, ChevronDown } from 'lucide-react'
import { useAccounts } from '@/hooks/useAccounts'
import { useTransactions } from '@/hooks/useTransactions'
import { useChatHistory } from '@/hooks/useChatHistory'
import { parseCommand, findAccount, findExplicitCategory, normalize, formatCurrency } from '@/services/chatParser'
import { TYPE_META } from '@/components/accounts/AccountCard'
import { CATEGORIES, getCategory, DEFAULT_CATEGORY_ID } from '@/constants/categories'

// ─── Confirmation matchers (applied to normalized input) ─────────────────────
const YES = /^(sim|s|confirma?|ok|yes|pode|vai|e)$/i
const NO  = /^(nao|n|cancela?r?|desiste?|nope)$/i

// ─── pendingCmd shapes ───────────────────────────────────────────────────────
// null
// { stage: 'account', type, amount, originalText }
// { stage: 'confirm', type, account, amount, originalText }

// ─── Welcome message (only shown when history is empty) ──────────────────────
const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  ts:   Date.now(),
  text:
    'Olá! Sou o assistente do GranInhA 🐷\n\n' +
    'Diga o que quer fazer em linguagem natural:\n\n' +
    '• "desconte 300 do Porquinho do Inter"\n' +
    '• "adicione 500 na Carteira"\n' +
    '• "gastei 50 em alimentação"\n' +
    '• "quanto tenho no total?"\n' +
    '• "categorias" — veja as categorias disponíveis\n' +
    '• "desfazer" — reverte a última transação desta sessão',
}

const HELP_TEXT =
  'Não entendi esse comando 🤔\n\n' +
  'Tente algo como:\n' +
  '• "desconte 50 do Nubank"\n' +
  '• "adicione 200 na carteira"\n' +
  '• "gastei 30" (se tiver só uma conta)\n' +
  '• "quanto tenho no total?"\n' +
  '• "desfazer"'

function buildBestGuessText({ verbAction, amount, accountName }, accounts) {
  const typeLabel = verbAction === 'add' ? 'entrada' : verbAction === 'deduct' ? 'saída' : null

  const parts = []
  if (typeLabel) parts.push(typeLabel)
  if (amount != null) parts.push(`de ${formatCurrency(amount)}`)
  if (accountName) parts.push(`na conta "${accountName}"`)

  const prefix = parts.length ? `Entendi: ${parts.join(' ')}.` : ''

  if (!typeLabel && amount != null) {
    const fmt = formatCurrency(amount)
    return `${prefix}\n\nIsso é uma entrada ou saída?\n• "adicione ${fmt}"\n• "desconte ${fmt}"`
  }

  if (typeLabel && amount == null) {
    const verb = verbAction === 'add' ? 'adicione' : 'desconte'
    const acc  = accountName ? ` no ${accountName}` : ''
    return `${prefix}\n\nQual é o valor? Ex: "${verb} 50${acc}"`
  }

  return HELP_TEXT
}

// ─── Response text helpers ───────────────────────────────────────────────────

function confirmText({ type, account, amount, category }) {
  const delta      = type === 'income' ? amount : -amount
  const newBalance = (account.balance ?? 0) + delta
  const verb       = type === 'income' ? 'Adicionar' : 'Descontar'
  const prep       = type === 'income' ? 'em' : 'de'
  const typeLabel  = TYPE_META[account.type]?.label ?? 'Conta'
  const cat        = getCategory(category)
  const catLine    = cat.id === DEFAULT_CATEGORY_ID
    ? `Categoria: ${cat.emoji} Outros (responda com o nome de uma categoria para especificar, ou confirme para manter como Outros)`
    : `Categoria: ${cat.emoji} ${cat.label}`
  return (
    `Confirma? ${verb} ${formatCurrency(amount)} ${prep} ${account.name} (${typeLabel}).\n` +
    `${catLine}\n` +
    `Saldo atual: ${formatCurrency(account.balance ?? 0)} → Novo saldo: ${formatCurrency(newBalance)}\n\n` +
    `Responda "sim" para confirmar ou "não" para cancelar.`
  )
}

function categoriesListText() {
  const lines = CATEGORIES.map(c => `${c.emoji} ${c.label}`).join('\n')
  return `📋 Categorias disponíveis:\n\n${lines}`
}

function noAccountText(name, accounts) {
  const list = accounts.map(a => `• ${a.name}`).join('\n')
  return `Não encontrei nenhuma conta chamada "${name}".\n\nSuas contas:\n${list}\n\nQual você quis dizer?`
}

function ambiguousText(candidates) {
  const list = candidates.map(a => `• ${a.name}`).join('\n')
  return `Encontrei mais de uma conta parecida:\n\n${list}\n\nQual delas você quer usar?`
}

function askAccountText(accounts) {
  const list = accounts.map(a => `• ${a.name}`).join('\n')
  return `Para qual conta?\n\n${list}\n\nDigite o nome da conta.`
}

// ─── Dynamic suggestions from real accounts ──────────────────────────────────

function buildSuggestions(accounts) {
  if (!accounts.length) return null  // null → show "create account" hint

  const [a0, a1] = accounts
  const sug      = []

  sug.push(`desconte 50 do ${a0.name}`)
  sug.push(a1 ? `adicione 200 no ${a1.name}` : `adicione 200 no ${a0.name}`)
  sug.push(`quanto tenho no ${a0.name}?`)
  sug.push('quanto tenho no total?')
  sug.push('categorias')
  sug.push('desfazer')

  return sug.slice(0, 6)
}

// ─── Category legend (collapsible) ────────────────────────────────────────────

function CategoryLegend() {
  const [open, setOpen] = useState(false)
  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors px-1"
      >
        <ChevronDown size={12} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
        Ver categorias disponíveis
      </button>
      {open && (
        <div className="flex flex-wrap gap-1.5 mt-2 px-1">
          {CATEGORIES.map(cat => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-dm-muted text-gray-600 dark:text-slate-300"
            >
              <span>{cat.emoji}</span>{cat.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Chat() {
  const { accounts, totalBalance }          = useAccounts()
  const { createTransaction, deleteTransaction } = useTransactions()
  const { history, saveMessages }           = useChatHistory()

  // messages === null while loading from Firestore
  const [messages,   setMessages]   = useState(null)
  const [input,      setInput]      = useState('')
  const [thinking,   setThinking]   = useState(false)
  const [pendingCmd, setPendingCmd] = useState(null)

  const lastChatTxRef = useRef(null)
  const bottomRef     = useRef(null)

  // Initialise local messages once Firestore history arrives
  useEffect(() => {
    if (history === null) return
    setMessages(history.length > 0 ? history : [WELCOME])
  }, [history])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const suggestions = useMemo(() => buildSuggestions(accounts), [accounts])

  // Only show suggestions on a fresh chat (≤1 message = just welcome)
  const showSuggestions = messages !== null && messages.length <= 1

  // ── Helpers ────────────────────────────────────────────────────────────────

  function pushMsg(role, text) {
    const msg = { id: Date.now() + Math.random(), role, text, ts: Date.now() }
    setMessages(prev => [...(prev ?? []), msg])
  }

  // ── Execute confirmed transaction ──────────────────────────────────────────

  async function doExecute(type, account, amount, originalText, category) {
    const created = await createTransaction({
      type,
      accountId:   account.id,
      amount,
      description: originalText,
      date:        new Date().toISOString(),
      category,
    })
    lastChatTxRef.current = created

    const delta      = type === 'income' ? amount : -amount
    const newBalance = (account.balance ?? 0) + delta
    const verb       = type === 'income' ? 'Adicionei' : 'Descontei'
    const prep       = type === 'income' ? 'em' : 'de'
    return `✅ ${verb} ${formatCurrency(amount)} ${prep} ${account.name}.\nNovo saldo: ${formatCurrency(newBalance)}`
  }

  // ── Core message processor ────────────────────────────────────────────────

  async function processMessage(text) {
    const normText = normalize(text)

    // ── Stage: awaiting confirmation ────────────────────────────────────────
    if (pendingCmd?.stage === 'confirm') {
      if (YES.test(normText)) {
        const { type, account, amount, originalText, category } = pendingCmd
        const reply = await doExecute(type, account, amount, originalText, category)
        setPendingCmd(null)
        return reply
      }
      if (NO.test(normText)) {
        setPendingCmd(null)
        return '❌ Cancelado. Pode mandar outro comando!'
      }
      // Reply naming a category — update the pending category and re-confirm
      const catMatch = findExplicitCategory(text)
      if (catMatch) {
        const next = { ...pendingCmd, category: catMatch.id }
        setPendingCmd(next)
        return confirmText(next)
      }
      // Not yes/no — show confirmation again
      return `Por favor, responda "sim" ou "não".\n\n${confirmText(pendingCmd)}`
    }

    // ── Stage: awaiting account selection ───────────────────────────────────
    if (pendingCmd?.stage === 'account') {
      const { match, multiple, candidates } = findAccount(accounts, text)
      if (match) {
        const next = { stage: 'confirm', type: pendingCmd.type, account: match,
                       amount: pendingCmd.amount, originalText: pendingCmd.originalText,
                       category: pendingCmd.category }
        setPendingCmd(next)
        return confirmText(next)
      }
      if (multiple) return ambiguousText(candidates)   // keep 'account' pending
      // Unrecognised — clear pending and fall through to fresh parse
      setPendingCmd(null)
    }

    // ── Fresh command parse ──────────────────────────────────────────────────
    const cmd = parseCommand(text)

    // Undo
    if (cmd.action === 'undo') {
      if (!lastChatTxRef.current) return 'Não há transação recente para desfazer nesta sessão.'
      const tx   = lastChatTxRef.current
      await deleteTransaction(tx)
      lastChatTxRef.current = null
      const verb = tx.type === 'income' ? 'entrada' : 'saída'
      return `↩️ Feito! Desfiz a ${verb} de ${formatCurrency(tx.amount)}.`
    }

    // List available categories
    if (cmd.action === 'categories') {
      return categoriesListText()
    }

    // Balance query
    if (cmd.action === 'balance') {
      if (!cmd.accountName) return `💰 Saldo total: ${formatCurrency(totalBalance)}`
      const { match, multiple, candidates } = findAccount(accounts, cmd.accountName)
      if (!match && !multiple) return noAccountText(cmd.accountName, accounts)
      if (multiple)            return ambiguousText(candidates)
      return `💰 ${match.name}: ${formatCurrency(match.balance ?? 0)}`
    }

    // Transaction
    if (cmd.action === 'add' || cmd.action === 'deduct') {
      const type = cmd.action === 'add' ? 'income' : 'expense'

      if (accounts.length === 0) {
        return '❌ Você não tem nenhuma conta criada. Vá em Contas para criar uma!'
      }

      // No account mentioned
      if (!cmd.accountName) {
        if (accounts.length === 1) {
          const next = { stage: 'confirm', type, account: accounts[0],
                         amount: cmd.amount, originalText: text, category: cmd.category }
          setPendingCmd(next)
          return confirmText(next)
        }
        setPendingCmd({ stage: 'account', type, amount: cmd.amount, originalText: text, category: cmd.category })
        return askAccountText(accounts)
      }

      // Account mentioned — fuzzy search
      const { match, multiple, candidates } = findAccount(accounts, cmd.accountName)
      if (!match && !multiple) return noAccountText(cmd.accountName, accounts)
      if (multiple) {
        setPendingCmd({ stage: 'account', type, amount: cmd.amount, originalText: text, category: cmd.category })
        return ambiguousText(candidates)
      }

      // Single match — ask confirmation
      const next = { stage: 'confirm', type, account: match,
                     amount: cmd.amount, originalText: text, category: cmd.category }
      setPendingCmd(next)
      return confirmText(next)
    }

    if (cmd.partial) return buildBestGuessText(cmd.partial, accounts)
    return HELP_TEXT
  }

  // ── Send handler ───────────────────────────────────────────────────────────

  async function handleSend(text) {
    const raw = (text ?? input).trim()
    if (!raw || thinking || messages === null) return
    setInput('')

    pushMsg('user', raw)
    setThinking(true)

    let replyText = ''
    try {
      replyText = await processMessage(raw)
    } catch (err) {
      console.error('Chat error:', err)
      replyText = `❌ Algo deu errado: ${err.message ?? 'Tente novamente.'}`
    } finally {
      setThinking(false)
    }

    pushMsg('assistant', replyText)

    // Persist asynchronously — do NOT await (keep UI snappy)
    saveMessages([
      { role: 'user',      text: raw },
      { role: 'assistant', text: replyText },
    ]).catch(err => console.error('Chat persist error:', err))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100dvh-9.5rem)] md:h-[calc(100dvh-3rem)] animate-fade-in">
      {/* Header */}
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Chat</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Gerencie suas finanças com linguagem natural</p>
      </div>

      {/* Message area */}
      {messages === null ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-2 h-2 bg-gray-300 dark:bg-gray-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          {thinking && <ThinkingBubble />}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Bottom controls */}
      <div className="shrink-0 space-y-2 pt-2">
        {showSuggestions && (
          suggestions === null ? (
            <p className="text-xs text-gray-400 dark:text-slate-500 px-1">
              💡 Crie uma conta em <span className="text-brand-600 dark:text-brand-400">Contas</span> para começar a usar o chat.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {suggestions.map(cmd => (
                <button
                  key={cmd}
                  onClick={() => handleSend(cmd)}
                  disabled={thinking || messages === null}
                  className="text-xs bg-gray-100 dark:bg-dm-muted hover:bg-gray-200 dark:hover:bg-dm-hover disabled:opacity-40 text-gray-600 dark:text-slate-300 px-3 py-1.5 rounded-full transition-colors"
                >
                  {cmd}
                </button>
              ))}
            </div>
          )
        )}

        <CategoryLegend />

        <div className="flex gap-2">
          <input
            className="input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={thinking || messages === null}
            placeholder={
              pendingCmd?.stage === 'confirm'
                ? 'Digite "sim" para confirmar ou "não" para cancelar…'
                : pendingCmd?.stage === 'account'
                  ? 'Digite o nome da conta…'
                  : 'Ex: desconte 300 do Porquinho do Inter…'
            }
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || thinking || messages === null}
            className="btn-primary flex items-center justify-center w-11 h-11 shrink-0"
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
      <div className={`max-w-[80%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
            isUser
              ? 'bg-brand-600 text-white rounded-tr-sm'
              : 'bg-gray-100 dark:bg-dm-muted text-gray-900 dark:text-slate-100 rounded-tl-sm'
          }`}
        >
          {msg.text}
        </div>
        <span className="text-[10px] text-gray-400 dark:text-slate-600 px-1">
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
      <div className="bg-gray-100 dark:bg-dm-muted rounded-2xl rounded-tl-sm px-4 py-3.5">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
