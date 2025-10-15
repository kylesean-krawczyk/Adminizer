import React from 'react'

interface CustomLogoProps {
  logoUrl: string
  fallbackText?: string
}

const CustomLogo: React.FC<CustomLogoProps> = ({ logoUrl, fallbackText = 'Adminizer' }) => {
  const [logoError, setLogoError] = React.useState(false)

  const handleLogoError = () => {
    setLogoError(true)
  }

  if (logoError || !logoUrl) {
    return (
      <h1 className="text-xl font-bold text-gray-900">
        {fallbackText}
      </h1>
    )
  }

  // Handle data URL (base64 encoded SVG)
  if (logoUrl.startsWith('data:')) {
    try {
      const svgContent = atob(logoUrl.split(',')[1])
      return (
        <div 
          className="h-8 flex items-center"
          dangerouslySetInnerHTML={{ __html: svgContent }}
          onError={handleLogoError}
        />
      )
    } catch (error) {
      console.error('Error parsing logo data URL:', error)
      return (
        <h1 className="text-xl font-bold text-gray-900">
          {fallbackText}
        </h1>
      )
    }
  }

  // Handle regular URL
  return (
    <img
      src={logoUrl}
      alt="Organization Logo"
      className="h-8 w-auto"
      onError={handleLogoError}
    />
  )
}

export default CustomLogo