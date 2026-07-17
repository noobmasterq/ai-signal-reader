import type { Article } from '../types'
import { ArticleCard, type CardVariant } from './ArticleCard'

interface ArticleGridProps {
  articles: Article[]
  readIds: Set<string>
  favoriteIds: Set<string>
  onOpen: (article: Article) => void
  onToggleFavorite: (articleId: string) => void
}

function variantForIndex(index: number): CardVariant {
  if (index === 0) return 'feature'
  if (index > 0 && index % 7 === 3) return 'wide'
  return 'standard'
}

export function ArticleGrid(props: ArticleGridProps) {
  return (
    <section className="article-grid" aria-label="按时间倒序排列的文章">
      {props.articles.map((article, index) => (
        <ArticleCard
          key={article.id}
          article={article}
          variant={variantForIndex(index)}
          isRead={props.readIds.has(article.id)}
          isFavorite={props.favoriteIds.has(article.id)}
          priority={index < 3}
          onOpen={props.onOpen}
          onToggleFavorite={props.onToggleFavorite}
        />
      ))}
    </section>
  )
}
