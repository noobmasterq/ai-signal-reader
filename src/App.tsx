import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { ArticleDetail } from './components/ArticleDetail'
import { ArticleGrid } from './components/ArticleGrid'
import { EmptyState } from './components/EmptyState'
import { FilterSheet } from './components/FilterSheet'
import { usePersistentIdSet, usePersistentState } from './hooks/usePersistentState'
import type { Article, FeedPayload, SourceStatus, ThemePreference, ViewMode } from './types'
import { filterArticles } from './utils/articles'

function initialHash() {
  const params = new URLSearchParams(window.location.hash.slice(1))
  return {
    articleId: params.get('article'),
    view: (params.get('view') as ViewMode | null) ?? 'all',
    sourceId: params.get('source') ?? 'all',
    category: params.get('category') ?? 'all',
  }
}

function resolveTheme(preference: ThemePreference) {
  if (preference !== 'system') return preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const hash = useMemo(initialHash, [])
  const [feed, setFeed] = useState<FeedPayload | null>(null)
  const [statuses, setStatuses] = useState<SourceStatus[]>([])
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [view, setView] = useState<ViewMode>(hash.view)
  const [sourceId, setSourceId] = useState(hash.sourceId)
  const [category, setCategory] = useState(hash.category)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(hash.articleId)
  const [theme, setTheme] = usePersistentState<ThemePreference>('theme', 'system')
  const read = usePersistentIdSet('read')
  const favorites = usePersistentIdSet('favorites')

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const base = import.meta.env.BASE_URL
        const [feedResponse, statusResponse] = await Promise.all([
          fetch(`${base}data/articles.json`, { signal: controller.signal }),
          fetch(`${base}data/source-status.json`, { signal: controller.signal }),
        ])
        if (!feedResponse.ok) throw new Error(`文章数据加载失败（${feedResponse.status}）`)
        const payload = await feedResponse.json() as FeedPayload
        const sourceStatuses = statusResponse.ok ? await statusResponse.json() as SourceStatus[] : []
        setFeed(payload)
        setStatuses(sourceStatuses)
      } catch (error) {
        if (!controller.signal.aborted) setLoadingError(error instanceof Error ? error.message : '文章数据加载失败')
      }
    }
    load()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved = resolveTheme(theme)
      document.documentElement.dataset.theme = resolved
      document.documentElement.style.colorScheme = resolved
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#08080a' : '#f5f5f7')
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedArticleId) params.set('article', selectedArticleId)
    if (view !== 'all') params.set('view', view)
    if (sourceId !== 'all') params.set('source', sourceId)
    if (category !== 'all') params.set('category', category)
    const next = params.toString()
    window.history.replaceState(null, '', next ? `#${next}` : `${window.location.pathname}${window.location.search}`)
  }, [category, selectedArticleId, sourceId, view])

  const articleMap = useMemo(() => new Map((feed?.articles ?? []).map((article) => [article.id, article])), [feed])
  const selectedArticle = selectedArticleId ? articleMap.get(selectedArticleId) ?? null : null
  const filters = useMemo(() => ({ query: deferredQuery, view, sourceId, category }), [category, deferredQuery, sourceId, view])
  const filteredArticles = useMemo(
    () => filterArticles(feed?.articles ?? [], filters, read.ids, favorites.ids),
    [favorites.ids, feed?.articles, filters, read.ids],
  )
  const categories = useMemo(() => [...new Set(statuses.map((status) => status.category))].sort(), [statuses])
  const sortedStatuses = useMemo(() => [...statuses].sort((a, b) => a.sourceName.localeCompare(b.sourceName)), [statuses])
  const sourceLabel = statuses.find((status) => status.sourceId === sourceId)?.sourceName ?? '来源'
  const categoryLabel = category === 'all' ? '类别' : category

  function openArticle(article: Article) {
    read.toggle(article.id, true)
    setSelectedArticleId(article.id)
  }

  function resetFilters() {
    setQuery('')
    setView('all')
    setSourceId('all')
    setCategory('all')
  }

  if (loadingError) {
    return (
      <main className="fatal-state">
        <h1>AI Signal</h1>
        <p>{loadingError}</p>
        <button className="primary-action" type="button" onClick={() => window.location.reload()}>重新加载</button>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <AppHeader
        generatedAt={feed?.generatedAt ?? null}
        sourceErrors={feed?.sourceErrors ?? 0}
        query={query}
        onQueryChange={setQuery}
        view={view}
        onViewChange={setView}
        sourceLabel={sourceLabel}
        categoryLabel={categoryLabel}
        onOpenFilters={() => setFiltersOpen(true)}
        theme={theme}
        onThemeChange={setTheme}
      />

      <main className={`feed-main ${query !== deferredQuery ? 'is-updating' : ''}`}>
        <div className="result-count" aria-live="polite">
          {feed ? `${filteredArticles.length} 篇文章` : '正在整理最新文章…'}
        </div>
        {feed && filteredArticles.length > 0 ? (
          <ArticleGrid
            articles={filteredArticles}
            readIds={read.ids}
            favoriteIds={favorites.ids}
            onOpen={openArticle}
            onToggleFavorite={favorites.toggle}
          />
        ) : feed ? (
          <EmptyState favorites={view === 'favorites'} onReset={resetFilters} />
        ) : (
          <div className="loading-grid" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        )}
      </main>

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        sources={sortedStatuses}
        categories={categories}
        sourceId={sourceId}
        category={category}
        onSourceChange={setSourceId}
        onCategoryChange={setCategory}
      />

      <ArticleDetail
        article={selectedArticle}
        isFavorite={selectedArticle ? favorites.ids.has(selectedArticle.id) : false}
        isRead={selectedArticle ? read.ids.has(selectedArticle.id) : false}
        onClose={() => setSelectedArticleId(null)}
        onToggleFavorite={favorites.toggle}
        onToggleRead={read.toggle}
      />
    </div>
  )
}
