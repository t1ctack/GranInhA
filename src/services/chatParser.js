// Natural language command parser

const UNDO_PATTERN = /^(?:desfazer?|cancelar?|undo|voltar|desfaz)$/i

const DEDUCT_PATTERNS = [
  // "desconte/gastei/paguei X do/da/de/no/na/em/com Y" — account required
  /(?:desconte?|retire|debite?|subtraia?|gaste?i?)\s+(?:R\$\s*)?(\d+(?:[.,]\d{2})?)\s+(?:do?|da?|de?|no?|na?|em|com)\s+(.+)/i,
  /(?:paguei?|pagou|comprei?|comprou)\s+(?:R\$\s*)?(\d+(?:[.,]\d{2})?)\s+(?:com|no?|na?|do?|da?|de?|em)\s+(.+)/i,
  // "gastei/paguei X" — no explicit account (accountName will be null)
  /^(?:gastei?|paguei?|comprei|saiu|tirei)\s+(?:R\$\s*)?(\d+(?:[.,]\d{2})?)(?:\s+.*)?$/i,
]

const ADD_PATTERNS = [
  // "adicione/deposite/recebi X no/na/em Y" — account required
  /(?:adicion(?:e|ar|ou|ei)|deposit(?:e|ar|ou|ei)|coloque?|receb(?:i|eu))\s+(?:R\$\s*)?(\d+(?:[.,]\d{2})?)\s+(?:no?|na?|em|do?|da?|de?)\s+(.+)/i,
  /(?:entrou?|caiu?)\s+(?:R\$\s*)?(\d+(?:[.,]\d{2})?)\s+(?:no?|na?|em)\s+(.+)/i,
  // "recebi/ganhei X" — no explicit account
  /^(?:recebi|ganhei|entrou|caiu)\s+(?:R\$\s*)?(\d+(?:[.,]\d{2})?)(?:\s+.*)?$/i,
]

const BALANCE_PATTERNS = [
  /(?:quanto\s+(?:tenho|tem|h[aá])|saldo|total|meu\s+saldo)(?:\s+(?:no?|na?|em|do?|da?|de?)\s+(.+))?/i,
  /quanto\s+(?:tem|tenho|h[aá])\s+(?:no?|na?|em|do?|da?)\s+(.+)/i,
]

function parseAmount(str) {
  return parseFloat(String(str).replace(/\./g, '').replace(',', '.'))
}

export function parseCommand(text) {
  const t = text.trim()

  if (UNDO_PATTERN.test(t)) return { action: 'undo' }

  for (const pattern of DEDUCT_PATTERNS) {
    const m = t.match(pattern)
    if (m) return { action: 'deduct', amount: parseAmount(m[1]), accountName: m[2]?.trim() ?? null }
  }

  for (const pattern of ADD_PATTERNS) {
    const m = t.match(pattern)
    if (m) return { action: 'add', amount: parseAmount(m[1]), accountName: m[2]?.trim() ?? null }
  }

  for (const pattern of BALANCE_PATTERNS) {
    const m = t.match(pattern)
    if (m) return { action: 'balance', accountName: m[1]?.trim() ?? null }
  }

  return { action: 'unknown' }
}

/** Strips accents, lowercases, removes non-alphanumeric */
function normalize(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
}

/**
 * Fuzzy account lookup with three escalating strategies.
 * Returns { match, multiple, candidates }.
 */
export function findAccount(accounts, query) {
  if (!query || !accounts.length) return { match: null, multiple: false, candidates: [] }

  const q = normalize(query)

  // 1 — exact (after normalization)
  const exact = accounts.filter(a => normalize(a.name) === q)
  if (exact.length === 1) return { match: exact[0], multiple: false, candidates: exact }
  if (exact.length > 1)   return { match: null, multiple: true, candidates: exact }

  // 2 — substring containment (either direction)
  const contains = accounts.filter(a => {
    const n = normalize(a.name)
    return n.includes(q) || q.includes(n)
  })
  if (contains.length === 1) return { match: contains[0], multiple: false, candidates: contains }
  if (contains.length > 1)   return { match: null, multiple: true, candidates: contains }

  // 3 — word-level overlap (skip stopwords shorter than 3 chars)
  const qWords = q.split(/\s+/).filter(w => w.length >= 3)
  if (qWords.length) {
    const wordMatch = accounts.filter(a => {
      const aWords = normalize(a.name).split(/\s+/)
      return qWords.some(qw => aWords.some(aw => aw.includes(qw) || qw.includes(aw)))
    })
    if (wordMatch.length === 1) return { match: wordMatch[0], multiple: false, candidates: wordMatch }
    if (wordMatch.length > 1)   return { match: null, multiple: true, candidates: wordMatch }
  }

  return { match: null, multiple: false, candidates: [] }
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
