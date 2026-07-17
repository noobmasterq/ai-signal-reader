import { Bookmark, SearchX } from 'lucide-react'

export function EmptyState({ favorites, onReset }: { favorites: boolean; onReset: () => void }) {
  const Icon = favorites ? Bookmark : SearchX
  return (
    <section className="empty-state" aria-live="polite">
      <Icon size={32} strokeWidth={1.6} aria-hidden="true" />
      <h2>{favorites ? '还没有收藏文章' : '没有找到相关文章'}</h2>
      <p>{favorites ? '看到想稍后阅读的内容时，点一下书签即可。' : '试试其他关键词，或清除来源与类别筛选。'}</p>
      <button className="secondary-action" type="button" onClick={onReset}>清除筛选</button>
    </section>
  )
}
