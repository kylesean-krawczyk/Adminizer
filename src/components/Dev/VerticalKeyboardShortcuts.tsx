import { useEffect } from 'react'
import { useVertical } from '../../contexts/VerticalContext'
import { useVerticalSwitcher } from '../../hooks/useVerticalSwitcher'
import { VerticalId } from '../../config/types'

const isDevelopmentMode = import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV

const verticals: VerticalId[] = ['church', 'business', 'estate']

const VerticalKeyboardShortcuts = () => {
  const { verticalId } = useVertical()
  const { switchVertical, getEnabledVerticals } = useVerticalSwitcher()

  useEffect(() => {
    if (!isDevelopmentMode) return

    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'V') {
        event.preventDefault()

        const enabledVerticals = await getEnabledVerticals()
        const currentIndex = verticals.indexOf(verticalId)
        let nextIndex = (currentIndex + 1) % verticals.length

        let nextVertical = verticals[nextIndex]
        let attempts = 0

        while (!enabledVerticals.includes(nextVertical) && attempts < verticals.length) {
          nextIndex = (nextIndex + 1) % verticals.length
          nextVertical = verticals[nextIndex]
          attempts++
        }

        if (enabledVerticals.includes(nextVertical) && nextVertical !== verticalId) {
          try {
            await switchVertical(nextVertical)
          } catch (error) {
            console.error('Failed to switch vertical:', error)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [verticalId, switchVertical, getEnabledVerticals])

  return null
}

export default VerticalKeyboardShortcuts
