import { Bookmark, BookmarkCheck, CheckCircle2, Circle, ExternalLink, X } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Article } from '../types'
import { formatFullDate } from '../utils/articles'

interface ArticleDetailProps {
  article: Article | null
  isFavorite: boolean
  isRead: boolean
  onClose: () => void
  onToggleFavorite: (articleId: string) => void
  onToggleRead: (articleId: string) => void
}

export function ArticleDetail(props: ArticleDetailProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
    const dialog = dialogRef.current
    if (!dialog) return
    if (props.article && !dialog.open) dialog.showModal()
    if (!props.article && dialog.open) dialog.close()
  }, [props.article])

  const article = props.article
  if (!article) return <dialog ref={dialogRef} className="article-dialog" />

  const style = {
    '--source': article.sourceColor,
    '--source-alt': article.sourceColorAlt,
  } as CSSProperties
  const hasImage = Boolean(article.imageUrl) && !imageFailed

  return (
    <dialog
      ref={dialogRef}
      className="article-dialog"
      aria-labelledby="article-detail-title"
      onCancel={(event) => { event.preventDefault(); props.onClose() }}
      onClick={(event) => { if (event.target === dialogRef.current) props.onClose() }}
    >
      <article className="detail-panel" style={style}>
        <header className="detail-toolbar">
          <span className="detail-source"><i />{article.sourceName}</span>
          <button className="icon-button" type="button" aria-label="关闭文章详情" onClick={props.onClose}>
            <X size={21} strokeWidth={1.8} />
          </button>
        </header>

        <div className={`detail-media ${hasImage ? 'has-image' : 'uses-gradient'}`}>
          {hasImage ? (
            <img src={article.imageUrl ?? undefined} alt="" onError={() => setImageFailed(true)} />
          ) : (
            <div className="gradient-art"><i /><i /><i /></div>
          )}
        </div>

        <div className="detail-copy">
          <p className="detail-date">{formatFullDate(article.publishedAt)}{article.author ? ` · ${article.author}` : ''}</p>
          <h2 id="article-detail-title">{article.title}</h2>
          <p className="detail-summary">{article.summary}</p>
        </div>

        <footer className="detail-actions">
          <button className="secondary-action" type="button" onClick={() => props.onToggleRead(article.id)}>
            {props.isRead ? <CheckCircle2 size={18} strokeWidth={1.8} /> : <Circle size={18} strokeWidth={1.8} />}
            {props.isRead ? '标记未读' : '标记已读'}
          </button>
          <button className="secondary-action" type="button" onClick={() => props.onToggleFavorite(article.id)}>
            {props.isFavorite ? <BookmarkCheck size={18} strokeWidth={1.8} /> : <Bookmark size={18} strokeWidth={1.8} />}
            {props.isFavorite ? '取消收藏' : '收藏'}
          </button>
          <a className="primary-action" href={article.url} target="_blank" rel="noopener noreferrer">
            阅读原文<ExternalLink size={17} strokeWidth={1.8} />
          </a>
        </footer>
      </article>
    </dialog>
  )
}
