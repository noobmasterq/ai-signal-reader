import type { Article, Filters } from '../types'

const relativeFormatter = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' })
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
})
const dayFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'long', day: 'numeric', weekday: 'long',
})

export function filterArticles(
  articles: Article[],
  filters: Filters,
  readIds: Set<string>,
  favoriteIds: Set<string>,
) {
  const query = filters.query.trim().toLocaleLowerCase()
  return articles.filter((article) => {
    if (filters.view === 'unread' && readIds.has(article.id)) return false
    if (filters.view === 'favorites' && !favoriteIds.has(article.id)) return false
    if (filters.sourceId !== 'all' && article.sourceId !== filters.sourceId) return false
    if (filters.category !== 'all' && article.category !== filters.category) return false
    if (!query) return true
    const haystack = `${article.title} ${article.summary} ${article.author} ${article.sourceName}`.toLocaleLowerCase()
    return haystack.includes(query)
  })
}

export function formatRelativeTime(value: string | null, now = Date.now()) {
  if (!value) return '日期未知'
  const delta = Date.parse(value) - now
  if (!Number.isFinite(delta)) return '日期未知'
  const abs = Math.abs(delta)
  if (abs < 60_000) return '刚刚'
  if (abs < 3_600_000) return relativeFormatter.format(Math.round(delta / 60_000), 'minute')
  if (abs < 86_400_000) return relativeFormatter.format(Math.round(delta / 3_600_000), 'hour')
  if (abs < 604_800_000) return relativeFormatter.format(Math.round(delta / 86_400_000), 'day')
  return dateFormatter.format(new Date(value))
}

export function formatFullDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : '日期未知'
}

export function formatToday(value = new Date()) {
  return dayFormatter.format(value)
}

export function formatUpdatedAt(value: string | null) {
  if (!value) return '等待首次更新'
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Hong_Kong', hour: '2-digit', minute: '2-digit', hour12: false,
  })
  return `香港时间 ${formatter.format(new Date(value))} 更新`
}
