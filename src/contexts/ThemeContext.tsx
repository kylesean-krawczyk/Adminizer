import React, { useEffect, ReactNode } from 'react'
import { useVertical } from './VerticalContext'

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { vertical } = useVertical()

  useEffect(() => {
    if (!vertical?.branding?.colors) return

    const colors = vertical.branding.colors
    const root = document.documentElement

    root.style.setProperty('--color-primary', colors.primary)
    root.style.setProperty('--color-secondary', colors.secondary)
    root.style.setProperty('--color-accent', colors.accent)
    root.style.setProperty('--color-background', colors.background)
    root.style.setProperty('--color-surface', colors.surface)
    root.style.setProperty('--color-text-primary', colors.text.primary)
    root.style.setProperty('--color-text-secondary', colors.text.secondary)
    root.style.setProperty('--color-text-disabled', colors.text.disabled)
    root.style.setProperty('--color-success', colors.status.success)
    root.style.setProperty('--color-warning', colors.status.warning)
    root.style.setProperty('--color-error', colors.status.error)
    root.style.setProperty('--color-info', colors.status.info)
    root.style.setProperty('--color-borders', colors.borders)

    document.body.style.backgroundColor = colors.background
  }, [vertical])

  return <>{children}</>
}
