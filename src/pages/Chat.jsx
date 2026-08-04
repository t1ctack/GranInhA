import { useState } from 'react'
import { Send, Bot } from 'lucide-react'

const EXAMPLE_COMMANDS = [
  'desconte 300 do porquinho do Inter',
  'adicione 1500 na carteira principal',
  'quanto tenho no total?',
  'mostre meus gastos de hoje',
]

const WELCOME_MESSAGE = {
  id: 1,
  role: 'assistant',
  text: 'Olá! Sou o assistente do GranInhA 🐷\n\nVocê pode me dar comandos em linguagem natural para gerenciar suas contas. Por exemplo:\n\n• "desconte 300 do porquinho do Inter"\n• "adicione 500 na carteira principal"\n• "quanto tenho no total?"\n\nComo posso ajudar?',
}

export default function Chat() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput] = useState('')

  function handleSend(text) {
    const userMsg = text || input
    if (!userMsg.trim()) return

    setMessages(prev => [
      ...prev,
      { id: Date.now(), role: 'user', text: userMsg.trim() },
      {
        id: Date.now() + 1,
        role: 'assistant',
        text: '⚙️ Integração com IA em breve! Por enquanto estou aprendendo a falar.',
      },
    ])
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-7rem)] md:h-[calc(100dvh-3rem)] animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Chat</h1>
        <p className="text-slate-400 text-sm mt-1">Gerencie suas finanças com linguagem natural</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {msg.role === 'assistant' && (
              <div className="bg-brand-600/20 rounded-full p-2 h-9 w-9 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-brand-400" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-tr-sm'
                  : 'bg-slate-800 text-slate-100 rounded-tl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_COMMANDS.map(cmd => (
            <button
              key={cmd}
              onClick={() => handleSend(cmd)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            className="input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: desconte 300 do porquinho do Inter..."
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="btn-primary flex items-center gap-2 shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
