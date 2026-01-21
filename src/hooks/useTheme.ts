import { useVertical } from '../contexts/VerticalContext'
import { ThemeColors } from '../config/types'

export interface Theme {
  colors: ThemeColors
}

export function useTheme(): Theme {
  const { vertical } = useVertical()

  return {
    colors: vertical.branding.colors
  }
}
