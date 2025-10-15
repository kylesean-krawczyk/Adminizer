import { VerticalConfig, VerticalId } from './types'
import { churchConfig } from './verticals/church.config'
import { businessConfig } from './verticals/business.config'
import { estateConfig } from './verticals/estate.config'

export const verticals: Record<VerticalId, VerticalConfig> = {
  church: churchConfig,
  business: businessConfig,
  estate: estateConfig
}

export function getVerticalConfig(verticalId: VerticalId): VerticalConfig {
  const config = verticals[verticalId]
  if (!config) {
    console.warn(`Vertical config not found for: ${verticalId}, falling back to church`)
    return verticals.church
  }
  return config
}

function validateNavigationItem(item: any, path: string): string[] {
  const errors: string[] = []

  if (!item.id) {
    errors.push(`${path}: Missing required 'id' field`)
  }
  if (!item.name) {
    errors.push(`${path}: Missing required 'name' field`)
  }
  if (!item.route && !item.children) {
    errors.push(`${path}: Must have either 'route' or 'children' field`)
  }
  if (!item.icon) {
    console.warn(`${path}: Navigation item '${item.name}' missing icon (optional but recommended)`)
  }

  return errors
}

function validateNavigationConfig(navigation: any, verticalId: string): string[] {
  const errors: string[] = []

  if (!navigation.primaryNav || !Array.isArray(navigation.primaryNav)) {
    errors.push(`${verticalId}: primaryNav must be an array`)
  } else {
    navigation.primaryNav.forEach((item: any, index: number) => {
      errors.push(...validateNavigationItem(item, `${verticalId}.primaryNav[${index}]`))
    })
  }

  if (!navigation.departmentNav || !Array.isArray(navigation.departmentNav)) {
    errors.push(`${verticalId}: departmentNav must be an array`)
  } else {
    navigation.departmentNav.forEach((item: any, index: number) => {
      errors.push(...validateNavigationItem(item, `${verticalId}.departmentNav[${index}]`))
    })
  }

  if (!navigation.additionalDepartments || !Array.isArray(navigation.additionalDepartments)) {
    errors.push(`${verticalId}: additionalDepartments must be an array`)
  } else {
    navigation.additionalDepartments.forEach((item: any, index: number) => {
      errors.push(...validateNavigationItem(item, `${verticalId}.additionalDepartments[${index}]`))
    })
  }

  if (!navigation.operationsNav || !Array.isArray(navigation.operationsNav)) {
    errors.push(`${verticalId}: operationsNav must be an array`)
  } else {
    navigation.operationsNav.forEach((item: any, index: number) => {
      errors.push(...validateNavigationItem(item, `${verticalId}.operationsNav[${index}]`))
    })
  }

  if (!navigation.adminNav || !Array.isArray(navigation.adminNav)) {
    errors.push(`${verticalId}: adminNav must be an array`)
  } else {
    navigation.adminNav.forEach((item: any, index: number) => {
      errors.push(...validateNavigationItem(item, `${verticalId}.adminNav[${index}]`))
    })
  }

  return errors
}

export function validateVerticalConfig(config: VerticalConfig): boolean {
  try {
    const errors: string[] = []

    if (!config.id || !config.name || !config.displayName) {
      console.error(`[${config.id}] Vertical config missing required fields`)
      return false
    }

    if (!config.terminology || typeof config.terminology !== 'object') {
      console.error(`[${config.id}] Vertical config missing or invalid terminology`)
      return false
    }

    if (!config.navigation || typeof config.navigation !== 'object') {
      console.error(`[${config.id}] Vertical config missing or invalid navigation`)
      return false
    }

    const navErrors = validateNavigationConfig(config.navigation, config.id)
    if (navErrors.length > 0) {
      console.error(`[${config.id}] Navigation validation errors:`)
      navErrors.forEach(error => console.error(`  - ${error}`))
      errors.push(...navErrors)
    }

    return errors.length === 0
  } catch (error) {
    console.error('Error validating vertical config:', error)
    return false
  }
}

export function initializeVerticalConfigs(): boolean {
  let allValid = true
  Object.entries(verticals).forEach(([id, config]) => {
    const isValid = validateVerticalConfig(config)
    if (!isValid) {
      console.error(`Invalid config for vertical: ${id}`)
      allValid = false
    }
  })
  if (allValid) {
    console.log('All vertical configurations validated successfully')
  }
  return allValid
}

export * from './types'
export { churchConfig, businessConfig, estateConfig }
