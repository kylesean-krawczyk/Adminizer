import { useVertical } from '../contexts/VerticalContext'

export type TermCapitalization = 'none' | 'first' | 'title' | 'upper'

interface UseTerminologyOptions {
  capitalize?: TermCapitalization
  fallback?: string
}

const capitalize = (text: string, mode: TermCapitalization): string => {
  switch (mode) {
    case 'first':
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
    case 'title':
      return text
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    case 'upper':
      return text.toUpperCase()
    case 'none':
    default:
      return text
  }
}

export const useTerminology = () => {
  const { getTerm } = useVertical()

  const term = (
    key: string,
    options?: UseTerminologyOptions
  ): string => {
    const fallback = options?.fallback || key
    const termValue = getTerm(key, fallback)

    if (options?.capitalize && options.capitalize !== 'none') {
      return capitalize(termValue, options.capitalize)
    }

    return termValue
  }

  const plural = (key: string, options?: UseTerminologyOptions): string => {
    const pluralKey = `${key}s`
    const hasPluralDefined = getTerm(pluralKey) !== pluralKey

    if (hasPluralDefined) {
      return term(pluralKey, options)
    }

    const singularTerm = term(key, options)

    if (singularTerm.endsWith('y') && !['ay', 'ey', 'iy', 'oy', 'uy'].some(v => singularTerm.endsWith(v))) {
      return singularTerm.slice(0, -1) + 'ies'
    }
    if (singularTerm.endsWith('s') || singularTerm.endsWith('x') ||
        singularTerm.endsWith('z') || singularTerm.endsWith('ch') ||
        singularTerm.endsWith('sh')) {
      return singularTerm + 'es'
    }

    return singularTerm + 's'
  }

  const interpolate = (template: string, replacements: Record<string, string>): string => {
    let result = template

    Object.entries(replacements).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{${key}\\}`, 'g')
      result = result.replace(placeholder, value)
    })

    return result
  }

  return {
    term,
    plural,
    interpolate,
    getTerm
  }
}
