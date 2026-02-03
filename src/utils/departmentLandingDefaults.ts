import { DefaultStatCardTemplate, DefaultFeatureTemplate } from '../types/departmentLandingPage'

/**
 * Default stat card configurations by department
 */
export const defaultStatCards: Record<string, DefaultStatCardTemplate[]> = {
  'human-resources': [
    { label: 'Documents', iconName: 'FileText', metricType: 'documents', displayOrder: 0 },
    { label: 'Team Members', iconName: 'Users', metricType: 'team_members', displayOrder: 1 },
    { label: 'Active Projects', iconName: 'Briefcase', metricType: 'active_projects', displayOrder: 2 },
    { label: 'Resources', iconName: 'Folder', metricType: 'resources', displayOrder: 3 }
  ],
  'finance-accounting': [
    { label: 'Documents', iconName: 'FileText', metricType: 'documents', displayOrder: 0 },
    { label: 'Team Members', iconName: 'Users', metricType: 'team_members', displayOrder: 1 },
    { label: 'Active Projects', iconName: 'Calculator', metricType: 'active_projects', displayOrder: 2 },
    { label: 'Resources', iconName: 'DollarSign', metricType: 'resources', displayOrder: 3 }
  ],
  'sales': [
    { label: 'Documents', iconName: 'FileText', metricType: 'documents', displayOrder: 0 },
    { label: 'Team Members', iconName: 'Users', metricType: 'team_members', displayOrder: 1 },
    { label: 'Active Deals', iconName: 'TrendingUp', metricType: 'active_projects', displayOrder: 2 },
    { label: 'Resources', iconName: 'Target', metricType: 'resources', displayOrder: 3 }
  ],
  'operations': [
    { label: 'Documents', iconName: 'FileText', metricType: 'documents', displayOrder: 0 },
    { label: 'Team Members', iconName: 'Users', metricType: 'team_members', displayOrder: 1 },
    { label: 'Active Projects', iconName: 'Cog', metricType: 'active_projects', displayOrder: 2 },
    { label: 'Resources', iconName: 'Package', metricType: 'resources', displayOrder: 3 }
  ],
  'customer-support': [
    { label: 'Documents', iconName: 'FileText', metricType: 'documents', displayOrder: 0 },
    { label: 'Team Members', iconName: 'Users', metricType: 'team_members', displayOrder: 1 },
    { label: 'Open Tickets', iconName: 'Headphones', metricType: 'active_projects', displayOrder: 2 },
    { label: 'Resources', iconName: 'MessageCircle', metricType: 'resources', displayOrder: 3 }
  ],
  'member-care': [
    { label: 'Documents', iconName: 'FileText', metricType: 'documents', displayOrder: 0 },
    { label: 'Team Members', iconName: 'Users', metricType: 'team_members', displayOrder: 1 },
    { label: 'Active Requests', iconName: 'Heart', metricType: 'active_projects', displayOrder: 2 },
    { label: 'Resources', iconName: 'Gift', metricType: 'resources', displayOrder: 3 }
  ],
  'marketing': [
    { label: 'Documents', iconName: 'FileText', metricType: 'documents', displayOrder: 0 },
    { label: 'Team Members', iconName: 'Users', metricType: 'team_members', displayOrder: 1 },
    { label: 'Campaigns', iconName: 'Megaphone', metricType: 'active_projects', displayOrder: 2 },
    { label: 'Resources', iconName: 'Palette', metricType: 'resources', displayOrder: 3 }
  ],
  'it-technology': [
    { label: 'Documents', iconName: 'FileText', metricType: 'documents', displayOrder: 0 },
    { label: 'Team Members', iconName: 'Users', metricType: 'team_members', displayOrder: 1 },
    { label: 'Active Projects', iconName: 'Monitor', metricType: 'active_projects', displayOrder: 2 },
    { label: 'Resources', iconName: 'Shield', metricType: 'resources', displayOrder: 3 }
  ],
  'legal-compliance': [
    { label: 'Documents', iconName: 'FileText', metricType: 'documents', displayOrder: 0 },
    { label: 'Team Members', iconName: 'Users', metricType: 'team_members', displayOrder: 1 },
    { label: 'Active Cases', iconName: 'Clipboard', metricType: 'active_projects', displayOrder: 2 },
    { label: 'Resources', iconName: 'Shield', metricType: 'resources', displayOrder: 3 }
  ],
  'procurement': [
    { label: 'Documents', iconName: 'FileText', metricType: 'documents', displayOrder: 0 },
    { label: 'Team Members', iconName: 'Users', metricType: 'team_members', displayOrder: 1 },
    { label: 'Purchase Orders', iconName: 'ShoppingCart', metricType: 'active_projects', displayOrder: 2 },
    { label: 'Vendors', iconName: 'Package', metricType: 'resources', displayOrder: 3 }
  ],
  'project-management': [
    { label: 'Documents', iconName: 'FileText', metricType: 'documents', displayOrder: 0 },
    { label: 'Team Members', iconName: 'Users', metricType: 'team_members', displayOrder: 1 },
    { label: 'Active Projects', iconName: 'Briefcase', metricType: 'active_projects', displayOrder: 2 },
    { label: 'Resources', iconName: 'Folder', metricType: 'resources', displayOrder: 3 }
  ],
  'research-development': [
    { label: 'Documents', iconName: 'FileText', metricType: 'documents', displayOrder: 0 },
    { label: 'Team Members', iconName: 'Users', metricType: 'team_members', displayOrder: 1 },
    { label: 'Active Research', iconName: 'Activity', metricType: 'active_projects', displayOrder: 2 },
    { label: 'Resources', iconName: 'Award', metricType: 'resources', displayOrder: 3 }
  ],
  'quality-assurance': [
    { label: 'Documents', iconName: 'FileText', metricType: 'documents', displayOrder: 0 },
    { label: 'Team Members', iconName: 'Users', metricType: 'team_members', displayOrder: 1 },
    { label: 'Audits', iconName: 'CheckCircle', metricType: 'active_projects', displayOrder: 2 },
    { label: 'Resources', iconName: 'Star', metricType: 'resources', displayOrder: 3 }
  ]
}

/**
 * Default department features by department
 */
export const defaultFeatures: Record<string, DefaultFeatureTemplate[]> = {
  'human-resources': [
    { title: 'Employee records and profiles', displayOrder: 0 },
    { title: 'Onboarding and offboarding', displayOrder: 1 },
    { title: 'Time-off and attendance tracking', displayOrder: 2 },
    { title: 'Performance reviews and evaluations', displayOrder: 3 },
    { title: 'Training and development', displayOrder: 4 },
    { title: 'Benefits administration', displayOrder: 5 }
  ],
  'finance-accounting': [
    { title: 'Invoicing and billing', displayOrder: 0 },
    { title: 'Expense tracking and management', displayOrder: 1 },
    { title: 'Budget planning and monitoring', displayOrder: 2 },
    { title: 'Financial reporting and analysis', displayOrder: 3 },
    { title: 'Tax preparation and compliance', displayOrder: 4 },
    { title: 'Cash flow management', displayOrder: 5 }
  ],
  'sales': [
    { title: 'Lead management and tracking', displayOrder: 0 },
    { title: 'Deal pipeline and forecasting', displayOrder: 1 },
    { title: 'Customer relationship management', displayOrder: 2 },
    { title: 'Sales performance analytics', displayOrder: 3 },
    { title: 'Quote and proposal generation', displayOrder: 4 },
    { title: 'Territory and account management', displayOrder: 5 }
  ],
  'operations': [
    { title: 'Workflow design and optimization', displayOrder: 0 },
    { title: 'Inventory and asset management', displayOrder: 1 },
    { title: 'Facilities and space management', displayOrder: 2 },
    { title: 'Process documentation', displayOrder: 3 },
    { title: 'Quality control and standards', displayOrder: 4 },
    { title: 'Vendor and supplier management', displayOrder: 5 }
  ],
  'customer-support': [
    { title: 'Ticket and case management', displayOrder: 0 },
    { title: 'Customer communication tracking', displayOrder: 1 },
    { title: 'Knowledge base management', displayOrder: 2 },
    { title: 'Service level monitoring', displayOrder: 3 },
    { title: 'Customer satisfaction tracking', displayOrder: 4 },
    { title: 'Support team coordination', displayOrder: 5 }
  ],
  'member-care': [
    { title: 'Member records and profiles', displayOrder: 0 },
    { title: 'Member communication tracking', displayOrder: 1 },
    { title: 'Service request management', displayOrder: 2 },
    { title: 'Member satisfaction tracking', displayOrder: 3 },
    { title: 'Support team coordination', displayOrder: 4 },
    { title: 'Member engagement programs', displayOrder: 5 }
  ],
  'marketing': [
    { title: 'Campaign planning and execution', displayOrder: 0 },
    { title: 'Content creation and management', displayOrder: 1 },
    { title: 'Lead generation and nurturing', displayOrder: 2 },
    { title: 'Marketing analytics and ROI', displayOrder: 3 },
    { title: 'Brand management', displayOrder: 4 },
    { title: 'Social media coordination', displayOrder: 5 }
  ],
  'it-technology': [
    { title: 'IT asset management', displayOrder: 0 },
    { title: 'Software license tracking', displayOrder: 1 },
    { title: 'Security and compliance', displayOrder: 2 },
    { title: 'Help desk and support', displayOrder: 3 },
    { title: 'Infrastructure monitoring', displayOrder: 4 },
    { title: 'Technology planning', displayOrder: 5 }
  ],
  'legal-compliance': [
    { title: 'Contract management', displayOrder: 0 },
    { title: 'Policy development', displayOrder: 1 },
    { title: 'Regulatory compliance tracking', displayOrder: 2 },
    { title: 'Risk assessment and management', displayOrder: 3 },
    { title: 'Legal document storage', displayOrder: 4 },
    { title: 'Compliance reporting', displayOrder: 5 }
  ],
  'procurement': [
    { title: 'Vendor selection and management', displayOrder: 0 },
    { title: 'Purchase order processing', displayOrder: 1 },
    { title: 'Supplier relationship management', displayOrder: 2 },
    { title: 'Cost analysis and optimization', displayOrder: 3 },
    { title: 'Contract negotiation', displayOrder: 4 },
    { title: 'Procurement compliance', displayOrder: 5 }
  ],
  'project-management': [
    { title: 'Project planning and scheduling', displayOrder: 0 },
    { title: 'Task assignment and tracking', displayOrder: 1 },
    { title: 'Resource allocation', displayOrder: 2 },
    { title: 'Timeline and milestone management', displayOrder: 3 },
    { title: 'Team collaboration', displayOrder: 4 },
    { title: 'Project reporting and analysis', displayOrder: 5 }
  ],
  'research-development': [
    { title: 'Innovation tracking and management', displayOrder: 0 },
    { title: 'Product development lifecycle', displayOrder: 1 },
    { title: 'Research project coordination', displayOrder: 2 },
    { title: 'Testing and validation', displayOrder: 3 },
    { title: 'Intellectual property management', displayOrder: 4 },
    { title: 'R&D budget and resource planning', displayOrder: 5 }
  ],
  'quality-assurance': [
    { title: 'Quality control processes', displayOrder: 0 },
    { title: 'Audit planning and execution', displayOrder: 1 },
    { title: 'Standards compliance monitoring', displayOrder: 2 },
    { title: 'Defect tracking and resolution', displayOrder: 3 },
    { title: 'Quality metrics and reporting', displayOrder: 4 },
    { title: 'Continuous improvement initiatives', displayOrder: 5 }
  ]
}

/**
 * Get default stat cards for a department
 */
export const getDefaultStatCards = (departmentId: string): DefaultStatCardTemplate[] => {
  return defaultStatCards[departmentId] || defaultStatCards['human-resources']
}

/**
 * Get default features for a department
 */
export const getDefaultFeatures = (departmentId: string): DefaultFeatureTemplate[] => {
  return defaultFeatures[departmentId] || defaultFeatures['human-resources']
}

/**
 * Check if department has defaults configured
 */
export const hasDefaultConfig = (departmentId: string): boolean => {
  return departmentId in defaultStatCards && departmentId in defaultFeatures
}

/**
 * Get all department IDs that have defaults
 */
export const getAllDepartmentIds = (): string[] => {
  return Object.keys(defaultStatCards)
}
