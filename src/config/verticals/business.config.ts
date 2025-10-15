import {
  FileText,
  Users,
  Calculator,
  TrendingUp,
  Cog,
  Headphones,
  Megaphone,
  Monitor,
  Scale,
  Shield,
  Package,
  Briefcase,
  FlaskConical,
  CheckCircle,
  GitBranch
} from 'lucide-react'
import { VerticalConfig } from '../types'

export const businessConfig: VerticalConfig = {
  id: 'business',
  name: 'business',
  displayName: 'Small Business & Nonprofit',
  description: 'Complete business management platform for small businesses and nonprofit organizations',
  userModel: 'organizational',

  terminology: {
    members: 'employees',
    member: 'employee',
    employees: 'employees',
    employee: 'employee',
    customers: 'customers',
    customer: 'customer',
    donors: 'clients',
    donor: 'client',
    revenue: 'revenue',
    departments: 'departments',
    department: 'department',
    team: 'team',
    teamMember: 'team member',
    organization: 'business',
    organizations: 'businesses',
    admin: 'admin',
    admins: 'admins',
    user: 'user',
    users: 'users',
    documents: 'documents',
    document: 'document',
    operations: 'operations',
    events: 'meetings',
    event: 'meeting',
    inviteUser: 'Invite User',
    userManagement: 'User Management',
    totalUsers: 'Total Users',
    activeUsers: 'Active Users',
    welcomeMessage: 'Welcome to your business management dashboard',
    businessDepartments: 'Business Departments',
    businessOperations: 'Business Operations',
    organizationMembers: 'Organization Members',
    managementDashboard: 'business management dashboard',
    analytics: 'Customer Analytics',
    analyticsFeature: 'Customer Analytics',
    analyticsDescription: 'AI-powered customer insights and purchase behavior analysis',
    patterns: 'purchase patterns',
    campaigns: 'sales campaigns',
    segmentation: 'customer segmentation',
    insights: 'customer insights',
    relationships: 'customer relationships',
    relationshipManagement: 'customer relationship management',
    analyzing: 'analyzing customer behavior',
    optimizing: 'optimize sales',
    tracking: 'track revenue',
    forecasting: 'forecast sales',
    salesDepartmentName: 'Sales',
    salesDepartmentDescription: 'Comprehensive sales analytics and customer management platform',
    comingSoonMessage: 'is coming soon for your business. This powerful feature will help you analyze customer behavior, identify sales trends, and optimize revenue generation strategies.',
    accessRestrictedMessage: 'This area contains sensitive customer and sales information and requires administrator privileges.',
    featureUnavailableMessage: 'is not available for businesses at this time.'
  },

  navigation: {
    primaryNav: [
      { id: 'documents', name: 'Document Center', icon: FileText, route: '/documents' }
    ],
    departmentNav: [
      { id: 'human-resources', name: 'Team', icon: Users, route: '/department/human-resources', color: 'blue' },
      { id: 'finance-accounting', name: 'Finances', icon: Calculator, route: '/department/finance-accounting', color: 'green' },
      { id: 'sales', name: 'Sales', icon: TrendingUp, route: '/department/sales', color: 'emerald' },
      { id: 'operations', name: 'Projects', icon: Cog, route: '/department/operations', color: 'purple' },
      { id: 'customer-support', name: 'Customer Support', icon: Headphones, route: '/department/customer-support', color: 'indigo' }
    ],
    additionalDepartments: [
      { id: 'marketing', name: 'Marketing', icon: Megaphone, route: '/department/marketing', color: 'pink' },
      { id: 'it-technology', name: 'IT & Technology', icon: Monitor, route: '/department/it-technology', color: 'cyan' },
      { id: 'legal-compliance', name: 'Legal & Compliance', icon: Scale, route: '/department/legal-compliance', color: 'gray' },
      { id: 'procurement', name: 'Procurement', icon: Package, route: '/department/procurement', color: 'amber' },
      { id: 'project-management', name: 'Project Management', icon: Briefcase, route: '/department/project-management', color: 'sky' },
      { id: 'research-development', name: 'Research & Development', icon: FlaskConical, route: '/department/research-development', color: 'violet' },
      { id: 'quality-assurance', name: 'Quality Assurance', icon: CheckCircle, route: '/department/quality-assurance', color: 'lime' }
    ],
    operationsNav: [
      { id: 'workflows', name: 'Onboarding', icon: GitBranch, route: '/workflows', requiredRole: 'admin' },
      { id: 'hr', name: 'HR', icon: Users, route: '/operations/hr' },
      { id: 'accounting', name: 'Accounting', icon: Calculator, route: '/operations/accounting' },
      { id: 'legal', name: 'Legal', icon: Scale, route: '/operations/legal' },
      { id: 'branding', name: 'Branding', icon: Megaphone, route: '/operations/branding' },
      { id: 'social-media', name: 'Social Media', icon: Megaphone, route: '/operations/social-media' },
      { id: 'communications', name: 'Communications', icon: Headphones, route: '/operations/communications' },
      { id: 'volunteer-management', name: 'Team Management', icon: Users, route: '/operations/volunteer-management' },
      { id: 'streaming', name: 'Media & Content', icon: Monitor, route: '/operations/streaming' },
      { id: 'it', name: 'IT & Technology', icon: Monitor, route: '/operations/it' }
    ],
    adminNav: [
      { id: 'users', name: 'Users', icon: Users, route: '/users', requiredRole: 'admin' },
      { id: 'oauth', name: 'OAuth', icon: Shield, route: '/oauth', requiredRole: 'admin' }
    ]
  },

  features: [
    { id: 'document-management', name: 'Document Management', description: 'Upload, organize, and manage documents', enabled: true },
    { id: 'oauth-integrations', name: 'OAuth Integrations', description: 'Connect to third-party services', enabled: true },
    { id: 'customer-analytics', name: 'Customer Analytics', description: 'AI-powered customer insights', enabled: true, category: 'analytics' }
  ],

  integrations: {
    hr: [],
    accounting: []
  },

  aiCapabilities: [
    {
      id: 'customer-analytics',
      name: 'Customer Analytics',
      description: 'AI-powered insights into customer behavior',
      category: 'sales',
      enabled: true,
      features: ['Purchase pattern analysis', 'Customer segmentation']
    }
  ],

  departmentColors: {
    'human-resources': 'blue',
    'finance-accounting': 'green',
    'sales': 'emerald',
    'operations': 'purple',
    'customer-support': 'indigo'
  },

  branding: {
    colors: {
      primary: '#1E3A5F',
      secondary: '#2E7D32',
      accent: '#00897B',
      background: '#F8F9FA',
      surface: '#FFFFFF',
      text: {
        primary: '#263238',
        secondary: '#607D8B',
        disabled: '#B0BEC5'
      },
      status: {
        success: '#43A047',
        warning: '#FB8C00',
        error: '#E53935',
        info: '#1976D2'
      },
      borders: '#ECEFF1'
    }
  }
}
