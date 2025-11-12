import { supabase } from '../lib/supabase'
import { LogoUploadConfig, LogoValidationResult, LogoMetadata } from '../types/organizationCustomization'

export const LOGO_UPLOAD_CONFIG: LogoUploadConfig = {
  allowedFormats: ['image/svg+xml', 'image/png', 'image/jpeg'],
  maxFileSize: 2 * 1024 * 1024,
  minDimensions: { width: 200, height: 200 },
  recommendedFormat: 'SVG',
  recommendations: {
    svg: 'Best choice - scales perfectly at any size',
    png: 'Good - use transparent background for best results',
    jpg: 'Acceptable - may look pixelated when scaled'
  }
}

export const validateLogoUpload = async (file: File): Promise<LogoValidationResult> => {
  if (!LOGO_UPLOAD_CONFIG.allowedFormats.includes(file.type as any)) {
    return {
      valid: false,
      error: 'Please upload SVG, PNG, or JPG format'
    }
  }

  if (file.size > LOGO_UPLOAD_CONFIG.maxFileSize) {
    return {
      valid: false,
      error: `File size must be under ${formatFileSize(LOGO_UPLOAD_CONFIG.maxFileSize)}`
    }
  }

  if (file.type !== 'image/svg+xml') {
    try {
      const dimensions = await getImageDimensions(file)

      if (dimensions.width < LOGO_UPLOAD_CONFIG.minDimensions.width ||
          dimensions.height < LOGO_UPLOAD_CONFIG.minDimensions.height) {
        return {
          valid: false,
          error: `Image must be at least ${LOGO_UPLOAD_CONFIG.minDimensions.width}x${LOGO_UPLOAD_CONFIG.minDimensions.height} pixels for good quality`
        }
      }

      if (file.type === 'image/png') {
        const hasAlpha = await checkPNGTransparency(file)
        if (!hasAlpha) {
          return {
            valid: true,
            warning: 'Consider using a transparent background PNG for better appearance'
          }
        }
      }
    } catch (error) {
      console.error('Error validating image:', error)
      return {
        valid: false,
        error: 'Unable to validate image dimensions'
      }
    }
  }

  return { valid: true }
}

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

export const checkPNGTransparency = async (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(objectUrl)
        resolve(false)
        return
      }

      ctx.drawImage(img, 0, 0)

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 255) {
            URL.revokeObjectURL(objectUrl)
            resolve(true)
            return
          }
        }

        URL.revokeObjectURL(objectUrl)
        resolve(false)
      } catch (error) {
        URL.revokeObjectURL(objectUrl)
        resolve(false)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

export const uploadOrganizationLogo = async (
  file: File,
  organizationId: string
): Promise<LogoMetadata> => {
  const validation = await validateLogoUpload(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${organizationId}/logo-${Date.now()}.${fileExt}`

  const { error } = await supabase.storage
    .from('organization-assets')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    console.error('Error uploading logo:', error)
    throw new Error(`Failed to upload logo: ${error.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from('organization-assets')
    .getPublicUrl(fileName)

  let dimensions: { width: number; height: number } | undefined
  if (file.type !== 'image/svg+xml') {
    try {
      dimensions = await getImageDimensions(file)
    } catch (error) {
      console.warn('Could not get image dimensions:', error)
    }
  }

  return {
    url: publicUrl,
    format: file.type as LogoMetadata['format'],
    fileSize: file.size,
    dimensions,
    uploadedAt: new Date().toISOString()
  }
}

export const deleteOrganizationLogo = async (logoUrl: string): Promise<void> => {
  try {
    const urlParts = logoUrl.split('/organization-assets/')
    if (urlParts.length !== 2) {
      console.warn('Invalid logo URL format:', logoUrl)
      return
    }

    const filePath = urlParts[1]

    const { error } = await supabase.storage
      .from('organization-assets')
      .remove([filePath])

    if (error) {
      console.error('Error deleting logo:', error)
      throw new Error(`Failed to delete logo: ${error.message}`)
    }
  } catch (error) {
    console.error('Error in deleteOrganizationLogo:', error)
    throw error
  }
}

export const getLogoRecommendation = (format: string): string => {
  switch (format) {
    case 'image/svg+xml':
      return LOGO_UPLOAD_CONFIG.recommendations.svg
    case 'image/png':
      return LOGO_UPLOAD_CONFIG.recommendations.png
    case 'image/jpeg':
      return LOGO_UPLOAD_CONFIG.recommendations.jpg
    default:
      return 'Unknown format'
  }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export const getFormatDisplayName = (format: string): string => {
  switch (format) {
    case 'image/svg+xml':
      return 'SVG'
    case 'image/png':
      return 'PNG'
    case 'image/jpeg':
      return 'JPG'
    default:
      return 'Unknown'
  }
}

export const isRecommendedFormat = (format: string): boolean => {
  return format === 'image/svg+xml'
}
