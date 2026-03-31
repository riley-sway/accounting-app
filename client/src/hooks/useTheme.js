import { useState, useEffect } from 'react'

export function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('sway_theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('sway_theme', dark ? 'dark' : 'light')
  }, [dark])

  return [dark, () => setDark(d => !d)]
}
