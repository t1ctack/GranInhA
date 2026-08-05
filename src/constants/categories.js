// Pre-defined transaction categories — icon + color are fixed identity, never cycled.
// Colors are the validated 8-slot categorical set (dataviz skill), one hue per
// category; "outros" is the deliberate "Other" fold and stays neutral gray.
export const CATEGORIES = [
  { id: 'alimentacao', label: 'Alimentação', emoji: '🍔', color: '#2a78d6', colorDark: '#3987e5' },
  { id: 'transporte',  label: 'Transporte',  emoji: '🚗', color: '#eb6834', colorDark: '#d95926' },
  { id: 'moradia',     label: 'Moradia',     emoji: '🏠', color: '#1baf7a', colorDark: '#199e70' },
  { id: 'educacao',    label: 'Educação',    emoji: '📚', color: '#eda100', colorDark: '#c98500' },
  { id: 'saude',       label: 'Saúde',       emoji: '💊', color: '#e87ba4', colorDark: '#d55181' },
  { id: 'salario',     label: 'Salário',     emoji: '💰', color: '#008300', colorDark: '#008300' },
  { id: 'lazer',       label: 'Lazer',       emoji: '🎮', color: '#4a3aa7', colorDark: '#9085e9' },
  { id: 'compras',     label: 'Compras',     emoji: '🛍️', color: '#e34948', colorDark: '#e66767' },
  { id: 'outros',      label: 'Outros',      emoji: '📦', color: '#94a3b8', colorDark: '#64748b' },
]

export const DEFAULT_CATEGORY_ID = 'outros'

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))

/** Always returns a valid category — falls back to "outros" for missing/unknown ids. */
export function getCategory(id) {
  return CATEGORY_MAP[id] ?? CATEGORY_MAP[DEFAULT_CATEGORY_ID]
}

export function getCategoryColor(id, isDark = false) {
  const cat = getCategory(id)
  return isDark ? cat.colorDark : cat.color
}
