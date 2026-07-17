import { useCallback, useEffect, useState } from 'react'

const PREFIX = 'ai-signal:v1:'

function readValue<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(`${PREFIX}${key}`)
    return stored ? JSON.parse(stored) as T : fallback
  } catch {
    return fallback
  }
}

function writeValue<T>(key: string, value: T) {
  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value))
  } catch {
    // Storage may be unavailable in private browsing or restricted contexts.
  }
}

export function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readValue(key, fallback))

  useEffect(() => {
    writeValue(key, value)
  }, [key, value])

  return [value, setValue] as const
}

export function usePersistentIdSet(key: string) {
  const [ids, setIds] = useState<Set<string>>(() => new Set(readValue<string[]>(key, [])))

  useEffect(() => {
    writeValue(key, [...ids])
  }, [ids, key])

  const toggle = useCallback((id: string, force?: boolean) => {
    setIds((current) => {
      const next = new Set(current)
      const shouldAdd = force ?? !next.has(id)
      if (shouldAdd) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  return { ids, toggle }
}
