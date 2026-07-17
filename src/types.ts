export type ViewMode = 'all' | 'unread' | 'favorites'
export type ThemePreference = 'system' | 'light' | 'dark'

export interface Article {
  id: string
  sourceId: string
  sourceName: string
  category: string
  sourceColor: string
  sourceColorAlt: string
  title: string
  url: string
  author: string
  summary: string
  imageUrl: string | null
  publishedAt: string | null
  dateUnknown: boolean
  fetchedAt: string
}

export interface FeedPayload {
  generatedAt: string
  timezone: string
  totalArticles: number
  sourcesConfigured: number
  sourcesOk: number
  sourceErrors: number
  articles: Article[]
}

export interface SourceStatus {
  sourceId: string
  sourceName: string
  siteUrl: string
  feedUrl: string | null
  method?: 'feed' | 'html' | null
  category: string
  color: string
  colorAlt: string
  status: 'ok' | 'stale' | 'error'
  itemCount: number
  lastSuccessAt: string | null
  checkedAt: string
  durationMs: number
  error: string | null
}

export interface Filters {
  query: string
  view: ViewMode
  sourceId: string
  category: string
}
