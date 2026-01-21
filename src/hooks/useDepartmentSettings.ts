import { useState, useEffect } from 'react'

interface DepartmentSettings {
  [departmentId: string]: boolean
}

export const useDepartmentSettings = () => {
  const [settings, setSettings] = useState<DepartmentSettings>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load department visibility settings from localStorage
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('department-visibility-settings')
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings))
        } else {
          // Default settings - all departments visible by default
          const defaultSettings: DepartmentSettings = {
            'marketing': true,
            'it-technology': true,
            'legal-compliance': true,
            'procurement': true,
            'project-management': true,
            'research-development': true,
            'quality-assurance': true
          }
          setSettings(defaultSettings)
          localStorage.setItem('department-visibility-settings', JSON.stringify(defaultSettings))
        }
      } catch (error) {
        console.error('Error loading department settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const updateDepartmentVisibility = (departmentId: string, visible: boolean) => {
    const newSettings = { ...settings, [departmentId]: visible }
    setSettings(newSettings)
    localStorage.setItem('department-visibility-settings', JSON.stringify(newSettings))
  }

  const isDepartmentVisible = (departmentId: string): boolean => {
    return settings[departmentId] !== false // Default to true if not set
  }

  const resetToDefaults = () => {
    const defaultSettings: DepartmentSettings = {
      'marketing': true,
      'it-technology': true,
      'legal-compliance': true,
      'procurement': true,
      'project-management': true,
      'research-development': true,
      'quality-assurance': true
    }
    setSettings(defaultSettings)
    localStorage.setItem('department-visibility-settings', JSON.stringify(defaultSettings))
  }

  const getVisibleDepartments = (departmentIds: string[]): string[] => {
    return departmentIds.filter(id => isDepartmentVisible(id))
  }

  return {
    settings,
    loading,
    updateDepartmentVisibility,
    isDepartmentVisible,
    resetToDefaults,
    getVisibleDepartments
  }
}