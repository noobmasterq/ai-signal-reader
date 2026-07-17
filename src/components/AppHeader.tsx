import { Search, SlidersHorizontal } from 'lucide-react'
import type { ThemePreference, ViewMode } from '../types'
import { formatToday, formatUpdatedAt } from '../utils/articles'
import { SignalMark } from './SignalMark'
import { ThemeMenu } from './ThemeMenu'

interface AppHeaderProps {
  generatedAt: string | null
  sourceErrors: number
  query: string
  onQueryChange: (query: string) => void
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  sourceLabel: string
  categoryLabel: string
  onOpenFilters: () => void
  theme: ThemePreference
  onThemeChange: (theme: ThemePreference) => void
}

const views: Array<{ value: ViewMode; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'unread', label: '未读' },
  { value: 'favorites', label: '收藏' },
]

export function AppHeader(props: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-row">
        <a className="brand" href="#" aria-label="AI Signal 首页">
          <SignalMark />
          <span>AI Signal</span>
        </a>
        <div className="header-meta">
          <span>{formatToday()}</span>
          <span className="meta-separator" aria-hidden="true" />
          <span>{formatUpdatedAt(props.generatedAt)}</span>
          {props.sourceErrors > 0 ? (
            <span className="source-warning">{props.sourceErrors} 个来源暂时不可用</span>
          ) : null}
        </div>
        <ThemeMenu value={props.theme} onChange={props.onThemeChange} />
      </div>

      <div className="title-row">
        <h1>今日更新</h1>
      </div>

      <div className="control-bar">
        <label className="search-field">
          <Search size={18} strokeWidth={1.8} aria-hidden="true" />
          <span className="sr-only">搜索文章</span>
          <input
            type="search"
            value={props.query}
            onChange={(event) => props.onQueryChange(event.target.value)}
            placeholder="搜索文章"
          />
        </label>

        <div className="segmented" aria-label="文章状态">
          {views.map((item) => (
            <button
              key={item.value}
              type="button"
              className={props.view === item.value ? 'selected' : ''}
              aria-pressed={props.view === item.value}
              onClick={() => props.onViewChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button className="filter-button" type="button" onClick={props.onOpenFilters}>
          <SlidersHorizontal size={18} strokeWidth={1.8} aria-hidden="true" />
          <span>{props.sourceLabel}</span>
          <span className="filter-divider" aria-hidden="true" />
          <span>{props.categoryLabel}</span>
        </button>
      </div>
    </header>
  )
}
