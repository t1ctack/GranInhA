// Natural language command parser

// ─── Type labels (normalized — no accents) ───────────────────────────────────
const TYPE_LABELS = {
  piggy:       'porquinho',
  credit_card: 'cartao de credito',
  wallet:      'carteira',
  checking:    'conta corrente',
  other:       'outro',
}

// ─── Regex patterns ───────────────────────────────────────────────────────────

const UNDO_PATTERN = /^(?:desfazer?|cancelar?|undo|voltar|desfaz)$/i

const DEDUCT_PATTERNS = [
  // "desconte/gastei/paguei X do/da/de/no/na/em/com Y" — account specified
  /(?:desconte?|retire|debite?|subtraia?|gaste?i?)\s+(?:R\$\s*)?(\d+(?:[.,]\d{2})?)\s+(?:do?|da?|de?|no?|na?|em|com)\s+(.+)/i,
  /(?:paguei?|pagou|comprei?|comprou)\s+(?:R\$\s*)?(\d+(?:[.,]\d{2})?)\s+(?:com|no?|na?|do?|da?|de?|em)\s+(.+)/i,
  // "gastei/paguei X" — no account specified (accountName → null)
  /^(?:gastei?|paguei?|comprei|saiu|tirei)\s+(?:R\$\s*)?(\d+(?:[.,]\d{2})?)(?:\s+.*)?$/i,
]

const ADD_PATTERNS = [
  // "adicione/deposite/recebi X no/na/em Y" — account specified
  /(?:adicion(?:e|ar|ou|ei)|deposit(?:e|ar|ou|ei)|coloque?|receb(?:i|eu))\s+(?:R\$\s*)?(\d+(?:[.,]\d{2})?)\s+(?:no?|na?|em|do?|da?|de?)\s+(.+)/i,
  /(?:entrou?|caiu?)\s+(?:R\$\s*)?(\d+(?:[.,]\d{2})?)\s+(?:no?|na?|em)\s+(.+)/i,
  // "recebi/ganhei X" — no account
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

  for (const p of DEDUCT_PATTERNS) {
    const m = t.match(p)
    if (m) return { action: 'deduct', amount: parseAmount(m[1]), accountName: m[2]?.trim() ?? null }
  }

  for (const p of ADD_PATTERNS) {
    const m = t.match(p)
    if (m) return { action: 'add', amount: parseAmount(m[1]), accountName: m[2]?.trim() ?? null }
  }

  for (const p of BALANCE_PATTERNS) {
    const m = t.match(p)
    if (m) return { action: 'balance', accountName: m[1]?.trim() ?? null }
  }

  return { action: 'unknown' }
}

// ─── Normalization ────────────────────────────────────────────────────────────

/** Lowercase, remove diacritics (U+0300–U+036F), strip non-alphanumeric */
export function normalize(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
}

// ─── Levenshtein distance ─────────────────────────────────────────────────────

function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  let curr = new Array(b.length + 1)

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, curr] = [curr, prev]
  }

  return prev[b.length]
}

/** Max edit distance allowed for a string of a given length */
function fuzzyThreshold(len) {
  if (len <= 4) return 1
  if (len <= 7) return 2
  return 3
}

// ─── Account finder ───────────────────────────────────────────────────────────

function hit(account)       { return { match: account, multiple: false, candidates: [account] } }
function multi(candidates)  { return { match: null,    multiple: true,  candidates } }
const NONE                = { match: null, multiple: false, candidates: [] }

/**
 * Four-stage fuzzy account lookup.
 * Searches both the account's name and its type label (e.g. "carteira", "porquinho").
 *
 * Stage 1 — exact match (normalized)
 * Stage 2 — substring containment (either direction)
 * Stage 3 — word-level overlap (words ≥ 3 chars)
 * Stage 4 — Levenshtein on name words (typo tolerance, words ≥ 4 chars)
 */
export function findAccount(accounts, query) {
  if (!query || !accounts.length) return NONE

  const q = normalize(query)
  if (!q) return NONE

  // Pre-compute search targets per account
  const data = accounts.map(a => ({
    a,
    nameN: normalize(a.name),
    typeN: normalize(TYPE_LABELS[a.type] ?? ''),
  }))

  // ── Stage 1: exact ──────────────────────────────────────────────────────────
  const exact = data.filter(({ nameN, typeN }) => nameN === q || typeN === q)
  if (exact.length === 1) return hit(exact[0].a)
  if (exact.length > 1)   return multi(exact.map(x => x.a))

  // ── Stage 2: containment ────────────────────────────────────────────────────
  const contains = data.filter(({ nameN, typeN }) =>
    nameN.includes(q) || q.includes(nameN) ||
    (typeN && (typeN.includes(q) || q.includes(typeN)))
  )
  if (contains.length === 1) return hit(contains[0].a)
  if (contains.length > 1)   return multi(contains.map(x => x.a))

  // ── Stage 3: word-level overlap ─────────────────────────────────────────────
  const qWords3 = q.split(/\s+/).filter(w => w.length >= 3)
  if (qWords3.length) {
    const wordMatch = data.filter(({ nameN, typeN }) => {
      const targets = [...nameN.split(/\s+/), ...typeN.split(/\s+/)]
      return qWords3.some(qw => targets.some(tw => tw.includes(qw) || qw.includes(tw)))
    })
    if (wordMatch.length === 1) return hit(wordMatch[0].a)
    if (wordMatch.length > 1)   return multi(wordMatch.map(x => x.a))
  }

  // ── Stage 4: Levenshtein (name only — type labels are short, prone to false positives) ──
  const qWords4 = q.split(/\s+/).filter(w => w.length >= 4)

  const leven = data.filter(({ nameN }) => {
    // Full-string comparison
    if (q.length >= 4 && nameN.length >= 4) {
      if (levenshtein(q, nameN) <= fuzzyThreshold(q.length)) return true
    }
    // Word-level comparison
    const nameWords4 = nameN.split(/\s+/).filter(w => w.length >= 4)
    return qWords4.some(qw =>
      nameWords4.some(nw => levenshtein(qw, nw) <= fuzzyThreshold(qw.length))
    )
  })
  if (leven.length === 1) return hit(leven[0].a)
  if (leven.length > 1)   return multi(leven.map(x => x.a))

  return NONE
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
