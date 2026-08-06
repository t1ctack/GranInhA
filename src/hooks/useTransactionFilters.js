import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

const DEFAULT_TYPE   = 'all'
const DEFAULT_PERIOD = 'all'

function parseList(param) {
  return param ? param.split(',').filter(Boolean) : []
}

/** Filter state for the Transactions page, persisted to the URL query string. */
export function useTransactionFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => ({
    accountIds:  parseList(searchParams.get('acc')),
    type:        searchParams.get('type') ?? DEFAULT_TYPE,
    categoryIds: parseList(searchParams.get('cat')),
    period:      searchParams.get('period') ?? DEFAULT_PERIOD,
    dateFrom:    searchParams.get('from') ?? '',
    dateTo:      searchParams.get('to') ?? '',
  }), [searchParams])

  const update = useCallback((patch) => {
    const merged = { ...filters, ...patch }
    const next = new URLSearchParams()

    if (merged.accountIds.length)                next.set('acc', merged.accountIds.join(','))
    if (merged.type !== DEFAULT_TYPE)             next.set('type', merged.type)
    if (merged.categoryIds.length)                next.set('cat', merged.categoryIds.join(','))
    if (merged.period !== DEFAULT_PERIOD)         next.set('period', merged.period)
    if (merged.period === 'custom' && merged.dateFrom) next.set('from', merged.dateFrom)
    if (merged.period === 'custom' && merged.dateTo)   next.set('to', merged.dateTo)

    setSearchParams(next, { replace: true })
  }, [filters, setSearchParams])

  const toggleAccount = useCallback((id) => {
    const set = new Set(filters.accountIds)
    set.has(id) ? set.delete(id) : set.add(id)
    update({ accountIds: [...set] })
  }, [filters.accountIds, update])

  const toggleCategory = useCallback((id) => {
    const set = new Set(filters.categoryIds)
    set.has(id) ? set.delete(id) : set.add(id)
    update({ categoryIds: [...set] })
  }, [filters.categoryIds, update])

  const setType = useCallback((type) => update({ type }), [update])

  const setPeriod = useCallback((period) => {
    update({ period, ...(period !== 'custom' ? { dateFrom: '', dateTo: '' } : {}) })
  }, [update])

  const setCustomRange = useCallback((dateFrom, dateTo) => {
    update({ period: 'custom', dateFrom, dateTo })
  }, [update])

  const clearAccounts   = useCallback(() => update({ accountIds: [] }), [update])
  const clearCategories = useCallback(() => update({ categoryIds: [] }), [update])
  const clearType       = useCallback(() => update({ type: DEFAULT_TYPE }), [update])
  const clearPeriod     = useCallback(() => update({ period: DEFAULT_PERIOD, dateFrom: '', dateTo: '' }), [update])

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  const activeCount =
    (filters.accountIds.length ? 1 : 0) +
    (filters.type !== DEFAULT_TYPE ? 1 : 0) +
    (filters.categoryIds.length ? 1 : 0) +
    (filters.period !== DEFAULT_PERIOD ? 1 : 0)

  return {
    filters,
    toggleAccount, toggleCategory, setType, setPeriod, setCustomRange,
    clearAccounts, clearCategories, clearType, clearPeriod, clearFilters,
    activeCount,
  }
}
