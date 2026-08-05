// Natural language command parser — v2

// ─── Category keyword inference (normalized — no accents) ────────────────────
const CATEGORY_KEYWORDS = {
  alimentacao: ['mercado','supermercado','ifood','restaurante','lanche','lanchonete','comida','padaria','acougue','feira','pizza','delivery'],
  transporte:  ['uber','99','taxi','gasolina','combustivel','onibus','metro','estacionamento','pedagio','carro','moto'],
  moradia:     ['aluguel','condominio','luz','energia','agua','internet','gas','iptu'],
  educacao:    ['curso','faculdade','escola','livro','mensalidade','matricula'],
  saude:       ['farmacia','remedio','medico','consulta','plano de saude','academia','dentista'],
  salario:     ['salario','holerite','pagamento','freela','freelance','13o','decimo terceiro'],
  lazer:       ['cinema','netflix','spotify','jogo','bar','show','viagem','streaming','balada'],
  compras:     ['shopping','loja','roupa','amazon','mercado livre','shopee'],
}

/** Fuzzy-free substring match of category keywords against the full command text. */
export function inferCategory(text) {
  const n = normalize(text)
  if (!n) return 'outros'
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => n.includes(kw))) return category
  }
  return 'outros'
}

// ─── Type labels (normalized — no accents) ───────────────────────────────────
const TYPE_LABELS = {
  piggy:       'porquinho',
  credit_card: 'cartao de credito',
  wallet:      'carteira',
  checking:    'conta corrente',
  other:       'outro',
}

// ─── Action verb dictionaries ─────────────────────────────────────────────────
const INCOME_VERBS = [
  'adicione','adiciona','adicionei','adicionar',
  'coloque','coloquei','colocar',
  'deposite','depositei','depositar',
  'recebi','receber',
  'ganhei','ganhar',
  'entrou','caiu',
]
const EXPENSE_VERBS = [
  'desconte','desconta','descontei','descontar',
  'tire','tirei','tirar',
  'gaste','gastei','gastar',
  'pague','paguei','pagar',
  'saiu',
  'retire','retirei','retirar',
  'comprei','compra','comprar',
  'debite','debitei','debitar',
  'subtraia','subtrair',
]
const UNDO_VERBS = [
  'desfazer','desfaz','desfaca',
  'cancelar','cancela',
  'undo','voltar',
]

// ─── Prepositions that introduce the account name ────────────────────────────
// Longest-first so multi-word entries are tried before single-word sub-strings
const ACCOUNT_PREPS = [
  'para o','para a','para os','para as','para',
  'pro','pra',
  'num','numa','no','na',
  'ao',
  'em',
  'do','da',
  'a',
  'de',
  'com',
]
const PREP_RE = new RegExp(
  `\\b(${ACCOUNT_PREPS.map(p => p.replace(/\s+/g, '\\s+')).join('|')})\\b`,
  'i',
)

// Patterns that introduce an optional description after the account name
const DESC_SEP_RE  = /\s+(?:de|com|referente(?:\s+a)?)\s+/i
const DESC_LEAD_RE = /^(?:de|com|referente\s*a?\s*)/i

// ─── Normalization ────────────────────────────────────────────────────────────
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

function fuzzyThreshold(len) {
  if (len <= 4) return 1
  if (len <= 7) return 2
  return 3
}

// ─── Verb / action matching ───────────────────────────────────────────────────
function bestDist(word, list) {
  let best = Infinity
  for (const v of list) {
    const d = levenshtein(word, v)
    if (d < best) best = d
  }
  return best
}

/**
 * Fuzzy-match the first word against action verb dictionaries.
 * Returns 'add' | 'deduct' | 'undo' | null
 */
function matchAction(word) {
  const w = normalize(word)
  if (!w) return null

  const thr  = fuzzyThreshold(w.length)
  const dInc = bestDist(w, INCOME_VERBS)
  const dExp = bestDist(w, EXPENSE_VERBS)
  const dUnd = bestDist(w, UNDO_VERBS)
  const min  = Math.min(dInc, dExp, dUnd)

  if (min > thr) return null
  if (dUnd === min) return 'undo'
  if (dInc === min) return 'add'
  return 'deduct'
}

// ─── Amount extraction ─────────────────────────────────────────────────────────
// Matches: R$10, R$ 10, 10 reais, 10,00, 1.000, 1.000,00, 10.00, etc.
const AMOUNT_RE = /(?:R\$\s*)?\d+(?:[.,]\d{1,3})*\s*(?:reais?|brl)?/i

function parseAmount(raw) {
  const s = raw
    .replace(/R\$\s*/i, '')
    .replace(/\s*(?:reais?|brl)\s*$/i, '')
    .trim()
  // BRL: comma as decimal separator OR dot as thousands separator
  if (s.includes(',') || /\d\.\d{3}/.test(s)) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.'))
  }
  return parseFloat(s)
}

/** Returns { value, start, end } or null */
function extractAmount(text) {
  const m = AMOUNT_RE.exec(text)
  if (!m) return null
  return { value: parseAmount(m[0]), start: m.index, end: m.index + m[0].length }
}

// ─── Account + description extraction ─────────────────────────────────────────
/**
 * Given text that begins with (or contains) a preposition followed by an
 * account name and optional description, returns:
 *   { accountName, description, found }
 * `found` is true if a preposition was matched.
 */
function parseAccountFromText(text) {
  const prepMatch = PREP_RE.exec(text)
  if (!prepMatch) return { accountName: null, description: null, found: false }

  const afterPrep = text.slice(prepMatch.index + prepMatch[0].length).trim()
  if (!afterPrep) return { accountName: null, description: null, found: true }

  // Split account name from optional description
  const descSplit = DESC_SEP_RE.exec(afterPrep)
  let accountName, description
  if (descSplit) {
    accountName = afterPrep.slice(0, descSplit.index).trim() || null
    description = afterPrep.slice(descSplit.index).trim().replace(DESC_LEAD_RE, '').trim() || null
  } else {
    accountName = afterPrep || null
    description = null
  }

  return { accountName, description, found: true }
}

// ─── Balance query ─────────────────────────────────────────────────────────────
const BALANCE_RE     = /(?:quanto\s+(?:tenho|tem|h[aá])|saldo|total|meu\s+saldo)/i
const BALANCE_ACC_RE = /\b(?:no?|na?|em|do?|da?|de?)\s+(.+)/i

// ─── Main parser ───────────────────────────────────────────────────────────────
export function parseCommand(text) {
  const t     = text.trim()
  const words = t.split(/\s+/)

  // ── Balance ─────────────────────────────────────────────────────────────────
  if (BALANCE_RE.test(t)) {
    const m = BALANCE_ACC_RE.exec(t)
    return { action: 'balance', accountName: m?.[1]?.trim() ?? null }
  }

  // ── Detect verb via fuzzy match on first word ────────────────────────────────
  const action = matchAction(words[0] ?? '')

  if (action === 'undo') return { action: 'undo' }

  if (action === 'add' || action === 'deduct') {
    const rest     = t.slice(words[0].length).trim()
    const amt      = extractAmount(rest)
    const category = inferCategory(t)

    if (amt) {
      const beforeAmt = rest.slice(0, amt.start).trim()
      const afterAmt  = rest.slice(amt.end).trim()

      // Standard order: [verb] [amount] [prep] [account] [desc?]
      const stdAcc = parseAccountFromText(afterAmt)
      if (stdAcc.found) {
        return { action, amount: amt.value, accountName: stdAcc.accountName, description: stdAcc.description, category }
      }

      // Alt order: [verb] [prep] [account] [amount]
      if (beforeAmt) {
        const altAcc = parseAccountFromText(beforeAmt)
        if (altAcc.found) {
          return { action, amount: amt.value, accountName: altAcc.accountName, description: null, category }
        }
      }

      // No account preposition found — amount only
      return { action, amount: amt.value, accountName: null, description: null, category }
    }

    // Verb recognized but no amount — try to salvage account name
    const acctInfo = parseAccountFromText(rest)
    return {
      action:  'unknown',
      partial: { verbAction: action, amount: null, accountName: acctInfo.accountName },
    }
  }

  // ── No verb recognized — look for partial clues ────────────────────────────
  const amt = extractAmount(t)
  if (amt) {
    const afterAmt = t.slice(amt.end).trim()
    const acctInfo = parseAccountFromText(afterAmt)
    return {
      action:  'unknown',
      partial: { verbAction: null, amount: amt.value, accountName: acctInfo.accountName },
    }
  }

  return { action: 'unknown' }
}

// ─── Normalization ── (re-exported for Chat.jsx YES/NO matching) ──────────────
// (already exported above)

// ─── Levenshtein ── (already defined above) ───────────────────────────────────

// ─── Account finder ───────────────────────────────────────────────────────────
function hit(account)      { return { match: account, multiple: false, candidates: [account] } }
function multi(candidates) { return { match: null,    multiple: true,  candidates } }
const NONE               = { match: null, multiple: false, candidates: [] }

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

  const data = accounts.map(a => ({
    a,
    nameN: normalize(a.name),
    typeN: normalize(TYPE_LABELS[a.type] ?? ''),
  }))

  // Stage 1: exact
  const exact = data.filter(({ nameN, typeN }) => nameN === q || typeN === q)
  if (exact.length === 1) return hit(exact[0].a)
  if (exact.length > 1)   return multi(exact.map(x => x.a))

  // Stage 2: containment
  const contains = data.filter(({ nameN, typeN }) =>
    nameN.includes(q) || q.includes(nameN) ||
    (typeN && (typeN.includes(q) || q.includes(typeN)))
  )
  if (contains.length === 1) return hit(contains[0].a)
  if (contains.length > 1)   return multi(contains.map(x => x.a))

  // Stage 3: word-level overlap (words ≥ 3 chars)
  const qWords3 = q.split(/\s+/).filter(w => w.length >= 3)
  if (qWords3.length) {
    const wordMatch = data.filter(({ nameN, typeN }) => {
      const targets = [...nameN.split(/\s+/), ...typeN.split(/\s+/)]
      return qWords3.some(qw => targets.some(tw => tw.includes(qw) || qw.includes(tw)))
    })
    if (wordMatch.length === 1) return hit(wordMatch[0].a)
    if (wordMatch.length > 1)   return multi(wordMatch.map(x => x.a))
  }

  // Stage 4: Levenshtein on name words (≥ 4 chars; not type — prevents false positives)
  const qWords4 = q.split(/\s+/).filter(w => w.length >= 4)
  const leven = data.filter(({ nameN }) => {
    if (q.length >= 4 && nameN.length >= 4) {
      if (levenshtein(q, nameN) <= fuzzyThreshold(q.length)) return true
    }
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
