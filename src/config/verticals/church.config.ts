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
  AlertTriangle,
  Heart,
  Palette
} from 'lucide-react'
import { VerticalConfig } from '../types'

export const churchConfig: VerticalConfig = {
  id: 'church',
  name: 'church',
  displayName: 'Church & Religious Organizations',
  description: 'Comprehensive management platform for churches, ministries, and religious organizations',
  userModel: 'organizational',

  terminology: {
    members: 'members',
    member: 'member',
    employees: 'staff',
    employee: 'staff member',
    customers: 'congregation',
    customer: 'congregant',
    donors: 'donors',
    donor: 'donor',
    revenue: 'giving',
    departments: 'ministries',
    department: 'ministry',
    team: 'ministry team',
    teamMember: 'team member',
    organization: 'church',
    organizations: 'churches',
    admin: 'admin',
    admins: 'admins',
    user: 'member',
    users: 'members',
    documents: 'documents',
    document: 'document',
    operations: 'ministries',
    events: 'services',
    event: 'service',
    inviteUser: 'Invite Member',
    userManagement: 'Member Management',
    totalUsers: 'Total Members',
    activeUsers: 'Active Members',
    welcomeMessage: 'Welcome to your ministry management dashboard',
    businessDepartments: 'Church Ministries',
    businessOperations: 'Ministry Operations',
    organizationMembers: 'Church Members',
    managementDashboard: 'ministry management dashboard',
    analytics: 'Donor Analytics',
    analyticsFeature: 'Donor Analytics',
    analyticsDescription: 'AI-powered donor insights and giving pattern analysis',
    patterns: 'giving patterns',
    campaigns: 'fundraising campaigns',
    segmentation: 'donor segmentation',
    insights: 'donor insights',
    relationships: 'donor relationships',
    relationshipManagement: 'donor management',
    analyzing: 'analyzing giving patterns',
    optimizing: 'optimize fundraising',
    tracking: 'track donations',
    forecasting: 'forecast giving',
    salesDepartmentName: 'Donor Relations',
    salesDepartmentDescription: 'Comprehensive donor analytics and relationship management platform',
    comingSoonMessage: 'is coming soon for your church. This powerful feature will help you analyze giving patterns and optimize fundraising campaigns.',
    accessRestrictedMessage: 'This area contains sensitive donor information and requires administrator privileges.',
    featureUnavailableMessage: 'is not available for churches at this time.'
  },

  dashboardConfig: {
    title: 'Church Ministries',
    subtitle: 'Access your ministry-specific tools and resources',
    coreSectionTitle: 'Core Ministries',
    additionalSectionTitle: 'Additional Ministries', // Deprecated - all departments now in Core Ministries
    stats: [
      {
        id: 'total-documents',
        label: 'Total Documents',
        icon: FileText,
        color: 'bg-blue-500',
        metricType: 'documents'
      },
      {
        id: 'member-records',
        label: 'Member Records',
        icon: Users,
        color: 'bg-green-500',
        metricType: 'categories'
      },
      {
        id: 'expiring-soon',
        label: 'Expiring Soon',
        icon: Clock,
        color: 'bg-yellow-500',
        metricType: 'expiring'
      },
      {
        id: 'overdue',
        label: 'Overdue',
        icon: AlertTriangle,
        color: 'bg-red-500',
        metricType: 'overdue'
      }
    ],
    coreDepartments: [
      {
        id: 'human-resources',
        name: 'Human Resources',
        description: 'Staff records, onboarding, performance',
        icon: Users,
        color: 'bg-blue-600 hover:bg-blue-700',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50',
        route: '/department/human-resources'
      },
      {
        id: 'finance-accounting',
        name: 'Finance & Accounting',
        description: 'Invoicing, expenses, financial reporting',
        icon: Calculator,
        color: 'bg-green-600 hover:bg-green-700',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50',
        route: '/department/finance-accounting'
      },
      {
        id: 'donor-relations',
        name: 'Donor Relations',
        description: 'Giving analytics and donor management',
        icon: TrendingUp,
        color: 'bg-emerald-600 hover:bg-emerald-700',
        textColor: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        route: '/department/sales',
        requiredFeature: 'donor-analytics'
      },
      {
        id: 'operations',
        name: 'Operations',
        description: 'Workflows, processes, ministry management',
        icon: Cog,
        color: 'bg-purple-600 hover:bg-purple-700',
        textColor: 'text-purple-600',
        bgColor: 'bg-purple-50',
        route: '/department/operations'
      },
      {
        id: 'member-care',
        name: 'Member Care',
        description: 'Member services and support',
        icon: Heart,
        color: 'bg-indigo-600 hover:bg-indigo-700',
        textColor: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        route: '/department/customer-support'
      },
      {
        id: 'communications-marketing',
        name: 'Communications & Marketing',
        description: 'Outreach, content, and communications',
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
        description: 'Innovation, ministry development',
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
    ],
    additionalDepartments: []
  },

  navigation: {
    primaryNav: [
      { id: 'documents', name: 'Document Center', icon: FileText, route: '/documents' }
    ],
    departmentNav: [
      { id: 'human-resources', name: 'Human Resources', icon: Users, route: '/department/human-resources', color: 'blue' },
      { id: 'finance-accounting', name: 'Finance & Accounting', icon: Calculator, route: '/department/finance-accounting', color: 'green' },
      { id: 'sales', name: 'Donor Relations', icon: TrendingUp, route: '/department/sales', color: 'emerald', requiredFeature: 'donor-analytics' },
      { id: 'operations', name: 'Operations', icon: Cog, route: '/department/operations', color: 'purple' },
      { id: 'member-care', name: 'Member Care', icon: Headphones, route: '/department/customer-support', color: 'indigo' },
      { id: 'communications-marketing', name: 'Communications & Marketing', icon: Megaphone, route: '/department/marketing', color: 'pink' },
      { id: 'it-technology', name: 'IT & Technology', icon: Monitor, route: '/department/it-technology', color: 'cyan' },
      { id: 'legal-compliance', name: 'Legal & Compliance', icon: Scale, route: '/department/legal-compliance', color: 'gray' },
      { id: 'procurement', name: 'Procurement', icon: Package, route: '/department/procurement', color: 'amber' },
      { id: 'project-management', name: 'Project Management', icon: Briefcase, route: '/department/project-management', color: 'sky' },
      { id: 'research-development', name: 'Research & Development', icon: FlaskConical, route: '/department/research-development', color: 'violet' },
      { id: 'quality-assurance', name: 'Quality Assurance', icon: CheckCircle, route: '/department/quality-assurance', color: 'lime' }
    ],
    additionalDepartments: [],
    operationsNav: [
      { id: 'workflows', name: 'Staff Onboarding', icon: GitBranch, route: '/workflows', requiredRole: 'admin' },
      { id: 'hr', name: 'HR', icon: Users, route: '/operations/hr' },
      { id: 'accounting', name: 'Accounting', icon: Calculator, route: '/operations/accounting' },
      { id: 'legal', name: 'Legal', icon: Scale, route: '/operations/legal' },
      { id: 'branding', name: 'Branding', icon: Megaphone, route: '/operations/branding' },
      { id: 'social-media', name: 'Social Media', icon: Megaphone, route: '/operations/social-media' },
      { id: 'communications', name: 'Communications', icon: Headphones, route: '/operations/communications' },
      { id: 'volunteer-management', name: 'People Management', icon: Users, route: '/operations/volunteer-management' },
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
    { id: 'donor-analytics', name: 'Donor Analytics', description: 'AI-powered donor insights and giving pattern analysis', enabled: true, category: 'analytics' },
    { id: 'donor-management', name: 'Donor Management', description: 'Comprehensive donor database and relationship management', enabled: true, category: 'fundraising' },
    { id: 'fundraising-ai', name: 'Fundraising AI Assistant', description: 'AI-powered fundraising recommendations and campaign optimization', enabled: true, category: 'fundraising' }
  ],

  integrations: {
    hr: [],
    accounting: []
  },

  aiCapabilities: [
    {
      id: 'donor-analytics',
      name: 'Donor Analytics',
      description: 'AI-powered insights into giving patterns',
      category: 'fundraising',
      enabled: true,
      features: ['Giving pattern analysis', 'Donor segmentation']
    }
  ],

  departmentColors: {
    'human-resources': 'blue',
    'finance-accounting': 'green',
    'sales': 'emerald',
    'operations': 'purple',
    'member-care': 'indigo',
    'communications-marketing': 'pink',
    'it-technology': 'cyan',
    'legal-compliance': 'gray',
    'procurement': 'orange',
    'project-management': 'red',
    'research-development': 'teal',
    'quality-assurance': 'lime'
  },

  branding: {
    colors: {
      primary: '#4A90E2',
      secondary: '#F5A623',
      accent: '#7B68EE',
      background: '#FAFAF8',
      surface: '#FFFFFF',
      text: {
        primary: '#4A4A4A',
        secondary: '#757575',
        disabled: '#BDBDBD'
      },
      status: {
        success: '#66BB6A',
        warning: '#FFA726',
        error: '#EF5350',
        info: '#42A5F5'
      },
      borders: '#E8E8E8'
    }
  }
}
