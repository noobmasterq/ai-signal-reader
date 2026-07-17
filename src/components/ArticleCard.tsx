import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import type { Article } from '../types'
import { formatRelativeTime } from '../utils/articles'

export type CardVariant = 'feature' | 'standard' | 'wide'

interface ArticleCardProps {
  article: Article
  variant: CardVariant
  isRead: boolean
  isFavorite: boolean
  priority?: boolean
  onOpen: (article: Article) => void
  onToggleFavorite: (articleId: string) => void
}

export function ArticleCard(props: ArticleCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const hasImage = Boolean(props.article.imageUrl) && !imageFailed
  const style = {
    '--source': props.article.sourceColor,
    '--source-alt': props.article.sourceColorAlt,
  } as CSSProperties

  return (
    <article
      className={`article-card ${props.variant} ${props.isRead ? 'is-read' : 'is-unread'} ${hasImage ? 'has-image' : 'uses-gradient'}`}
      style={style}
    >
      <button className="card-open" type="button" onClick={() => props.onOpen(props.article)} aria-label={`阅读：${props.article.title}`}>
        <div className="card-media" aria-hidden="true">
          {hasImage ? (
            <img
              src={props.article.imageUrl ?? undefined}
              alt=""
              loading={props.priority ? 'eager' : 'lazy'}
              fetchPriority={props.priority ? 'high' : 'auto'}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="gradient-art"><i /><i /><i /></div>
          )}
        </div>
        <div className="card-content">
          <div className="card-meta">
            <span className="source-name"><i aria-hidden="true" />{props.article.sourceName}</span>
            <span>{formatRelativeTime(props.article.publishedAt)}</span>
          </div>
          <h2>{props.article.title}</h2>
          <p>{props.article.summary}</p>
        </div>
      </button>
      <span className="unread-dot" aria-label={props.isRead ? '已读' : '未读'} />
      <button
        className={`favorite-button ${props.isFavorite ? 'selected' : ''}`}
        type="button"
        aria-label={props.isFavorite ? '取消收藏' : '收藏文章'}
        aria-pressed={props.isFavorite}
        onClick={() => props.onToggleFavorite(props.article.id)}
      >
        {props.isFavorite ? <BookmarkCheck size={18} strokeWidth={1.8} /> : <Bookmark size={18} strokeWidth={1.8} />}
      </button>
    </article>
  )
}
