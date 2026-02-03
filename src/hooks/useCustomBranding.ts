import { useState, useEffect } from 'react'

interface CustomBranding {
  logo?: string
  primaryColor?: string
  secondaryColor?: string
  organizationName?: string
}

export const useCustomBranding = () => {
  const [branding, setBranding] = useState<CustomBranding>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load custom branding from localStorage
    const loadBranding = () => {
      try {
        const savedLogo = localStorage.getItem('custom-logo')
        const savedPrimaryColor = localStorage.getItem('custom-primary-color')
        const savedSecondaryColor = localStorage.getItem('custom-secondary-color')
        const savedOrgName = localStorage.getItem('custom-organization-name')

        setBranding({
          logo: savedLogo || undefined,
          primaryColor: savedPrimaryColor || undefined,
          secondaryColor: savedSecondaryColor || undefined,
          organizationName: savedOrgName || undefined
        })
      } catch (error) {
        console.error('Error loading custom branding:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBranding()
  }, [])

  const updateLogo = (logoUrl: string | null) => {
    if (logoUrl) {
      localStorage.setItem('custom-logo', logoUrl)
      setBranding(prev => ({ ...prev, logo: logoUrl }))
    } else {
      localStorage.removeItem('custom-logo')
      setBranding(prev => ({ ...prev, logo: undefined }))
    }
  }

  const updatePrimaryColor = (color: string | null) => {
    if (color) {
      localStorage.setItem('custom-primary-color', color)
      setBranding(prev => ({ ...prev, primaryColor: color }))
    } else {
      localStorage.removeItem('custom-primary-color')
      setBranding(prev => ({ ...prev, primaryColor: undefined }))
    }
  }

  const updateSecondaryColor = (color: string | null) => {
    if (color) {
      localStorage.setItem('custom-secondary-color', color)
      setBranding(prev => ({ ...prev, secondaryColor: color }))
    } else {
      localStorage.removeItem('custom-secondary-color')
      setBranding(prev => ({ ...prev, secondaryColor: undefined }))
    }
  }

  const updateOrganizationName = (name: string | null) => {
    if (name) {
      localStorage.setItem('custom-organization-name', name)
      setBranding(prev => ({ ...prev, organizationName: name }))
    } else {
      localStorage.removeItem('custom-organization-name')
      setBranding(prev => ({ ...prev, organizationName: undefined }))
    }
  }

  const resetBranding = () => {
    localStorage.removeItem('custom-logo')
    localStorage.removeItem('custom-primary-color')
    localStorage.removeItem('custom-secondary-color')
    localStorage.removeItem('custom-organization-name')
    setBranding({})
  }

  return {
    branding,
    loading,
    updateLogo,
    updatePrimaryColor,
    updateSecondaryColor,
    updateOrganizationName,
    resetBranding
  }
}