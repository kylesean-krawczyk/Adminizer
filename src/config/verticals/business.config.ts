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
  GitBranch,
  Clock,
  FolderOpen,
  Palette
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

  dashboardConfig: {
    title: 'Business Operations',
    subtitle: 'Manage your business departments and workflows',
    coreSectionTitle: 'Core Departments',
    additionalSectionTitle: 'Additional Departments',
    stats: [
      {
        id: 'active-projects',
        label: 'Active Projects',
        icon: FolderOpen,
        color: 'bg-blue-500',
        metricType: 'documents'
      },
      {
        id: 'client-contracts',
        label: 'Client Contracts',
        icon: FileText,
        color: 'bg-green-500',
        metricType: 'categories'
      },
      {
        id: 'pending-tasks',
        label: 'Pending Tasks',
        icon: Clock,
        color: 'bg-yellow-500',
        metricType: 'expiring'
      },
      {
        id: 'team-members',
        label: 'Team Members',
        icon: Users,
        color: 'bg-purple-500',
        metricType: 'custom'
      }
    ],
    coreDepartments: [
      {
        id: 'human-resources',
        name: 'Human Resources',
        description: 'Team management, hiring, performance',
        icon: Users,
        color: 'bg-blue-600 hover:bg-blue-700',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50',
        route: '/department/human-resources'
      },
      {
        id: 'finance-accounting',
        name: 'Finance & Accounting',
        description: 'Financial planning, invoicing, reporting',
        icon: Calculator,
        color: 'bg-green-600 hover:bg-green-700',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50',
        route: '/department/finance-accounting'
      },
      {
        id: 'sales',
        name: 'Sales',
        description: 'AI-powered sales analytics and insights',
        icon: TrendingUp,
        color: 'bg-emerald-600 hover:bg-emerald-700',
        textColor: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        route: '/department/sales'
      },
      {
        id: 'operations',
        name: 'Operations',
        description: 'Workflows, inventory, process management',
        icon: Cog,
        color: 'bg-purple-600 hover:bg-purple-700',
        textColor: 'text-purple-600',
        bgColor: 'bg-purple-50',
        route: '/department/operations'
      },
      {
        id: 'customer-support',
        name: 'Customer Support',
        description: 'Tickets, cases, customer communications',
        icon: Headphones,
        color: 'bg-indigo-600 hover:bg-indigo-700',
        textColor: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        route: '/department/customer-support'
      }
    ],
    additionalDepartments: [
      {
        id: 'marketing',
        name: 'Marketing',
        description: 'Campaigns, content, lead generation',
        icon: Megaphone,
        color: 'bg-pink-600 hover:bg-pink-700',
        textColor: 'text-pink-600',
        bgColor: 'bg-pink-50',
        route: '/department/marketing'
      },
      {
        id: 'it-technology',
        name: 'IT & Technology',
        description: 'Asset management, helpdesk, security',
        icon: Monitor,
        color: 'bg-cyan-600 hover:bg-cyan-700',
        textColor: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        route: '/department/it-technology'
      },
      {
        id: 'legal-compliance',
        name: 'Legal & Compliance',
        description: 'Contracts, policies, risk management',
        icon: Scale,
        color: 'bg-gray-600 hover:bg-gray-700',
        textColor: 'text-gray-600',
        bgColor: 'bg-gray-50',
        route: '/department/legal-compliance'
      },
      {
        id: 'procurement',
        name: 'Procurement',
        description: 'Vendors, purchase orders, suppliers',
        icon: Package,
        color: 'bg-orange-600 hover:bg-orange-700',
        textColor: 'text-orange-600',
        bgColor: 'bg-orange-50',
        route: '/department/procurement'
      },
      {
        id: 'project-management',
        name: 'Project Management',
        description: 'Projects, tasks, timelines, resources',
        icon: Briefcase,
        color: 'bg-red-600 hover:bg-red-700',
        textColor: 'text-red-600',
        bgColor: 'bg-red-50',
        route: '/department/project-management'
      },
      {
        id: 'research-development',
        name: 'Research & Development',
        description: 'Innovation, product development, testing',
        icon: FlaskConical,
        color: 'bg-teal-600 hover:bg-teal-700',
        textColor: 'text-teal-600',
        bgColor: 'bg-teal-50',
        route: '/department/research-development'
      },
      {
        id: 'quality-assurance',
        name: 'Quality Assurance',
        description: 'Quality control, audits, standards',
        icon: CheckCircle,
        color: 'bg-lime-600 hover:bg-lime-700',
        textColor: 'text-lime-600',
        bgColor: 'bg-lime-50',
        route: '/department/quality-assurance'
      }
    ]
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
      { id: 'oauth', name: 'OAuth', icon: Shield, route: '/oauth', requiredRole: 'admin' },
      { id: 'ui-customization', name: 'UI Customization', icon: Palette, route: '/settings/organization-customization', requiredRole: 'master_admin' }
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
