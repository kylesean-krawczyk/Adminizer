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

  navigation: {
    primaryNav: [
      { id: 'documents', name: 'Document Center', icon: FileText, route: '/documents' }
    ],
    departmentNav: [
      { id: 'human-resources', name: 'Human Resources', icon: Users, route: '/department/human-resources', color: 'blue' },
      { id: 'finance-accounting', name: 'Finance & Accounting', icon: Calculator, route: '/department/finance-accounting', color: 'green' },
      { id: 'sales', name: 'Donor Relations', icon: TrendingUp, route: '/department/sales', color: 'emerald', requiredFeature: 'donor-analytics' },
      { id: 'operations', name: 'Operations', icon: Cog, route: '/department/operations', color: 'purple' },
      { id: 'customer-support', name: 'Member Care', icon: Headphones, route: '/department/customer-support', color: 'indigo' }
    ],
    additionalDepartments: [
      { id: 'marketing', name: 'Communications & Marketing', icon: Megaphone, route: '/department/marketing', color: 'pink' },
      { id: 'it-technology', name: 'IT & Technology', icon: Monitor, route: '/department/it-technology', color: 'cyan' },
      { id: 'legal-compliance', name: 'Legal & Compliance', icon: Scale, route: '/department/legal-compliance', color: 'gray' },
      { id: 'procurement', name: 'Procurement', icon: Package, route: '/department/procurement', color: 'amber' },
      { id: 'project-management', name: 'Project Management', icon: Briefcase, route: '/department/project-management', color: 'sky' },
      { id: 'research-development', name: 'Research & Development', icon: FlaskConical, route: '/department/research-development', color: 'violet' },
      { id: 'quality-assurance', name: 'Quality Assurance', icon: CheckCircle, route: '/department/quality-assurance', color: 'lime' }
    ],
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
      { id: 'oauth', name: 'OAuth', icon: Shield, route: '/oauth', requiredRole: 'admin' }
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
    'customer-support': 'indigo'
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
