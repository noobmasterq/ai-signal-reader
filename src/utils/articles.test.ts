import { describe, expect, it } from 'vitest'
import type { Article } from '../types'
import { filterArticles, formatRelativeTime } from './articles'

const article: Article = {
  id: 'a', sourceId: 'openai', sourceName: 'OpenAI', category: '公司研究',
  sourceColor: '#000', sourceColorAlt: '#fff', title: 'New model tools',
  url: 'https://example.com', author: 'A', summary: 'Developer update', imageUrl: null,
  publishedAt: '2026-07-17T00:00:00Z', dateUnknown: false, fetchedAt: '2026-07-17T01:00:00Z',
}

describe('article filtering', () => {
  it('filters by query and unread state', () => {
    const result = filterArticles([article], { query: 'developer', view: 'unread', sourceId: 'all', category: 'all' }, new Set(), new Set())
    expect(result).toHaveLength(1)
    expect(filterArticles([article], { query: '', view: 'unread', sourceId: 'all', category: 'all' }, new Set(['a']), new Set())).toHaveLength(0)
  })

  it('filters favorites', () => {
    expect(filterArticles([article], { query: '', view: 'favorites', sourceId: 'all', category: 'all' }, new Set(), new Set(['a']))).toHaveLength(1)
  })

  it('formats nearby timestamps', () => {
    expect(formatRelativeTime('2026-07-17T00:59:30Z', Date.parse('2026-07-17T01:00:00Z'))).toBe('刚刚')
  })
})
