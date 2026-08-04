// Natural language command parser — will be enhanced with AI in a later step

const DEDUCT_PATTERNS = [
  /(?:desconte?|retire|debite?|subtraia?|gaste?i?)\s+(?:R\$\s*)?(\d+(?:[.,]\d{2})?)\s+(?:do?|da?|de?)\s+(.+)/i,
  /(?:paguei|pag(?:ar|ou))\s+(?:R\$\s*)?(\d+(?:[.,]\d{2})?)\s+(?:com|no?|na?|do?|da?)\s+(.+)/i,
]

const ADD_PATTERNS = [
  /(?:adicion(?:e|ar|ou|ei)|deposit(?:e|ar|ou|ei)|coloque?|receb(?:i|eu))\s+(?:R\$\s*)?(\d+(?:[.,]\d{2})?)\s+(?:no?|na?|em|do?|da?)\s+(.+)/i,
  /(?:entrou?|caiu?)\s+(?:R\$\s*)?(\d+(?:[.,]\d{2})?)\s+(?:no?|na?|em)\s+(.+)/i,
]

const BALANCE_PATTERNS = [
  /(?:quanto\s+(?:tenho|tem|há)|saldo|total)(?:\s+(?:no?|na?|em|do?|da?)\s+(.+))?/i,
]

function parseAmount(str) {
  return parseFloat(str.replace(',', '.'))
}

export function parseCommand(text) {
  for (const pattern of DEDUCT_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      return { action: 'deduct', amount: parseAmount(match[1]), accountName: match[2].trim() }
    }
  }

  for (const pattern of ADD_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      return { action: 'add', amount: parseAmount(match[1]), accountName: match[2].trim() }
    }
  }

  for (const pattern of BALANCE_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      return { action: 'balance', accountName: match[1]?.trim() ?? null }
    }
  }

  return { action: 'unknown' }
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
