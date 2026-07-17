import { Check, RotateCcw, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { SourceStatus } from '../types'

interface FilterSheetProps {
  open: boolean
  onClose: () => void
  sources: SourceStatus[]
  categories: string[]
  sourceId: string
  category: string
  onSourceChange: (sourceId: string) => void
  onCategoryChange: (category: string) => void
}

export function FilterSheet(props: FilterSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (props.open && !dialog.open) dialog.showModal()
    if (!props.open && dialog.open) dialog.close()
  }, [props.open])

  return (
    <dialog
      ref={dialogRef}
      className="filter-dialog"
      aria-labelledby="filter-title"
      onCancel={(event) => { event.preventDefault(); props.onClose() }}
      onClick={(event) => { if (event.target === dialogRef.current) props.onClose() }}
    >
      <div className="sheet-panel">
        <div className="sheet-handle" aria-hidden="true" />
        <header className="sheet-header">
          <div>
            <h2 id="filter-title">筛选文章</h2>
            <p>选择一个来源和类别</p>
          </div>
          <button className="icon-button" type="button" aria-label="关闭筛选" onClick={props.onClose}>
            <X size={20} strokeWidth={1.8} />
          </button>
        </header>

        <section className="filter-section" aria-labelledby="category-heading">
          <h3 id="category-heading">类别</h3>
          <div className="filter-options compact">
            {['all', ...props.categories].map((category) => {
              const label = category === 'all' ? '全部类别' : category
              return (
                <button
                  key={category}
                  type="button"
                  className={props.category === category ? 'selected' : ''}
                  onClick={() => props.onCategoryChange(category)}
                >
                  <span>{label}</span>
                  {props.category === category ? <Check size={16} strokeWidth={2} /> : null}
                </button>
              )
            })}
          </div>
        </section>

        <section className="filter-section" aria-labelledby="source-heading">
          <h3 id="source-heading">来源</h3>
          <div className="filter-options source-options">
            <button
              type="button"
              className={props.sourceId === 'all' ? 'selected' : ''}
              onClick={() => props.onSourceChange('all')}
            >
              <span className="source-option-label"><i className="all-sources-dot" />全部来源</span>
              {props.sourceId === 'all' ? <Check size={16} strokeWidth={2} /> : null}
            </button>
            {props.sources.map((source) => (
              <button
                key={source.sourceId}
                type="button"
                className={props.sourceId === source.sourceId ? 'selected' : ''}
                onClick={() => props.onSourceChange(source.sourceId)}
              >
                <span className="source-option-label">
                  <i style={{ background: source.color }} />
                  {source.sourceName}
                </span>
                {props.sourceId === source.sourceId ? <Check size={16} strokeWidth={2} /> : null}
              </button>
            ))}
          </div>
        </section>

        <footer className="sheet-footer">
          <button
            className="secondary-action"
            type="button"
            onClick={() => { props.onSourceChange('all'); props.onCategoryChange('all') }}
          >
            <RotateCcw size={17} strokeWidth={1.8} />清除筛选
          </button>
          <button className="primary-action" type="button" onClick={props.onClose}>完成</button>
        </footer>
      </div>
    </dialog>
  )
}
