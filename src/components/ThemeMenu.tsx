import { Monitor, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import type { ThemePreference } from '../types'

const options: Array<{ value: ThemePreference; label: string; icon: typeof Monitor }> = [
  { value: 'system', label: '跟随系统', icon: Monitor },
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
]

export function ThemeMenu({ value, onChange }: { value: ThemePreference; onChange: (value: ThemePreference) => void }) {
  const [open, setOpen] = useState(false)
  const active = options.find((option) => option.value === value) ?? options[0]
  const ActiveIcon = active.icon

  return (
    <div className="theme-menu">
      <button
        className="icon-button"
        type="button"
        aria-label={`主题：${active.label}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <ActiveIcon size={19} strokeWidth={1.8} />
      </button>
      {open ? (
        <div className="theme-popover" role="menu" aria-label="选择主题">
          {options.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={value === option.value}
                className={value === option.value ? 'selected' : ''}
                onClick={() => { onChange(option.value); setOpen(false) }}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span>{option.label}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
