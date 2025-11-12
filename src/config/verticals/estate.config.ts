import {
  Vault,
  Users,
  DollarSign,
  Home,
  Shield,
  Key,
  Heart,
  FileCheck,
  Clock,
  Lock,
  GitBranch,
  FileText,
  FolderCheck
} from 'lucide-react'
import { VerticalConfig } from '../types'

export const estateConfig: VerticalConfig = {
  id: 'estate',
  name: 'estate',
  displayName: 'Personal Estate Planning',
  description: 'Comprehensive estate planning and digital asset management for individuals and families',
  userModel: 'personal',

  terminology: {
    members: 'beneficiaries',
    member: 'beneficiary',
    employees: 'trusted contacts',
    employee: 'trusted contact',
    customers: 'family members',
    customer: 'family member',
    donors: 'contributors',
    donor: 'contributor',
    revenue: 'assets',
    departments: 'categories',
    department: 'category',
    team: 'family',
    teamMember: 'family member',
    organization: 'estate',
    organizations: 'estates',
    admin: 'owner',
    admins: 'owners',
    user: 'individual',
    users: 'individuals',
    documents: 'vault items',
    document: 'vault item',
    operations: 'planning',
    events: 'milestones',
    event: 'milestone',
    inviteUser: 'Grant Access',
    userManagement: 'Access Management',
    totalUsers: 'Total Individuals',
    activeUsers: 'Active Individuals',
    welcomeMessage: 'Welcome to your estate planning dashboard',
    businessDepartments: 'Estate Categories',
    businessOperations: 'Estate Planning',
    organizationMembers: 'Estate Members',
    managementDashboard: 'estate planning dashboard',
    analytics: 'Asset Analytics',
    analyticsFeature: 'Asset Analytics',
    analyticsDescription: 'AI-powered insights into asset distribution and estate planning optimization',
    patterns: 'asset allocation patterns',
    campaigns: 'estate planning strategies',
    segmentation: 'beneficiary segmentation',
    insights: 'estate insights',
    relationships: 'beneficiary relationships',
    relationshipManagement: 'beneficiary management',
    analyzing: 'analyzing asset distribution',
    optimizing: 'optimize estate planning',
    tracking: 'track assets',
    forecasting: 'forecast estate value',
    salesDepartmentName: 'Digital Assets',
    salesDepartmentDescription: 'Comprehensive digital asset management and estate planning analytics',
    comingSoonMessage: 'is coming soon for your estate. This powerful feature will help you analyze asset distribution, identify planning opportunities, and optimize your estate strategy for your beneficiaries.',
    accessRestrictedMessage: 'This area contains sensitive estate and beneficiary information and requires owner privileges.',
    featureUnavailableMessage: 'is not available for estate planning at this time.'
  },

  dashboardConfig: {
    title: 'Estate Planning Services',
    subtitle: 'Access your client management and legal tools',
    coreSectionTitle: 'Core Services',
    additionalSectionTitle: 'Additional Services',
    stats: [
      {
        id: 'active-clients',
        label: 'Active Clients',
        icon: Users,
        color: 'bg-blue-500',
        metricType: 'custom'
      },
      {
        id: 'estate-plans',
        label: 'Estate Plans',
        icon: FolderCheck,
        color: 'bg-green-500',
        metricType: 'documents'
      },
      {
        id: 'trust-documents',
        label: 'Trust Documents',
        icon: FileText,
        color: 'bg-purple-500',
        metricType: 'categories'
      },
      {
        id: 'pending-reviews',
        label: 'Pending Reviews',
        icon: Clock,
        color: 'bg-yellow-500',
        metricType: 'expiring'
      }
    ],
    coreDepartments: [
      {
        id: 'client-management',
        name: 'Client Management',
        description: 'Client records, relationships, communications',
        icon: Users,
        color: 'bg-blue-600 hover:bg-blue-700',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50',
        route: '/department/human-resources'
      },
      {
        id: 'trust-estate-admin',
        name: 'Trust & Estate Admin',
        description: 'Trust administration and estate management',
        icon: FileCheck,
        color: 'bg-green-600 hover:bg-green-700',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50',
        route: '/department/finance-accounting'
      },
      {
        id: 'legal-documentation',
        name: 'Legal Documentation',
        description: 'Wills, trusts, powers of attorney',
        icon: FileText,
        color: 'bg-indigo-600 hover:bg-indigo-700',
        textColor: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        route: '/department/operations'
      },
      {
        id: 'financial-planning',
        name: 'Financial Planning',
        description: 'Asset allocation and financial strategies',
        icon: DollarSign,
        color: 'bg-emerald-600 hover:bg-emerald-700',
        textColor: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        route: '/department/sales'
      },
      {
        id: 'tax-services',
        name: 'Tax Services',
        description: 'Tax planning and compliance',
        icon: Shield,
        color: 'bg-purple-600 hover:bg-purple-700',
        textColor: 'text-purple-600',
        bgColor: 'bg-purple-50',
        route: '/department/customer-support'
      }
    ],
    additionalDepartments: [
      {
        id: 'probate-services',
        name: 'Probate Services',
        description: 'Estate settlement and probate administration',
        icon: Lock,
        color: 'bg-orange-600 hover:bg-orange-700',
        textColor: 'text-orange-600',
        bgColor: 'bg-orange-50',
        route: '/department/marketing'
      },
      {
        id: 'compliance-reporting',
        name: 'Compliance & Reporting',
        description: 'Regulatory compliance and reporting',
        icon: FileCheck,
        color: 'bg-cyan-600 hover:bg-cyan-700',
        textColor: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        route: '/department/it-technology'
      },
      {
        id: 'real-estate',
        name: 'Real Estate',
        description: 'Property management and transfers',
        icon: Home,
        color: 'bg-teal-600 hover:bg-teal-700',
        textColor: 'text-teal-600',
        bgColor: 'bg-teal-50',
        route: '/department/legal-compliance'
      }
    ]
  },

  navigation: {
    primaryNav: [
      { id: 'vault', name: 'Document Vault', icon: Vault, route: '/documents' }
    ],
    departmentNav: [
      { id: 'human-resources', name: 'Financial Accounts', icon: DollarSign, route: '/department/human-resources', color: 'green' },
      { id: 'finance-accounting', name: 'Legal Documents', icon: FileCheck, route: '/department/finance-accounting', color: 'blue' },
      { id: 'sales', name: 'Digital Assets', icon: Key, route: '/department/sales', color: 'purple' },
      { id: 'operations', name: 'Real Property', icon: Home, route: '/department/operations', color: 'orange' },
      { id: 'customer-support', name: 'Insurance Policies', icon: Shield, route: '/department/customer-support', color: 'indigo' }
    ],
    additionalDepartments: [
      { id: 'marketing', name: 'Subscriptions & Memberships', icon: Clock, route: '/department/marketing', color: 'cyan' },
      { id: 'it-technology', name: 'Legacy Planning', icon: Heart, route: '/department/it-technology', color: 'pink' },
      { id: 'legal-compliance', name: 'Beneficiary Management', icon: Users, route: '/department/legal-compliance', color: 'teal' }
    ],
    operationsNav: [
      { id: 'workflows', name: 'Access Onboarding', icon: GitBranch, route: '/workflows', requiredRole: 'admin' },
      { id: 'executor-access', name: 'Executor Access', icon: Lock, route: '/operations/hr' },
      { id: 'access-controls', name: 'Access Controls', icon: Key, route: '/operations/accounting' },
      { id: 'vault-security', name: 'Vault Security', icon: Shield, route: '/operations/legal' }
    ],
    adminNav: [
      { id: 'beneficiaries', name: 'Beneficiaries', icon: Users, route: '/users', requiredRole: 'admin' }
    ]
  },

  features: [
    { id: 'document-vault', name: 'Secure Document Vault', description: 'Encrypted storage for sensitive documents', enabled: true },
    { id: 'digital-asset-inventory', name: 'Digital Asset Inventory', description: 'Catalog and organize digital assets', enabled: true },
    { id: 'beneficiary-access', name: 'Beneficiary Access Controls', description: 'Manage who can access what and when', enabled: true }
  ],

  integrations: {
    'financial-institutions': [],
    'legal-services': []
  },

  aiCapabilities: [
    {
      id: 'asset-organization',
      name: 'Asset Organization Assistant',
      description: 'AI-powered suggestions for categorizing assets',
      category: 'organization',
      enabled: true,
      features: ['Automatic asset categorization', 'Missing document identification']
    }
  ],

  departmentColors: {
    'financial-accounts': 'green',
    'legal-documents': 'blue',
    'digital-assets': 'purple',
    'real-property': 'orange',
    'insurance-policies': 'indigo'
  },

  branding: {
    colors: {
      primary: '#2C3E50',
      secondary: '#C5A572',
      accent: '#5D8AA8',
      background: '#F5F2ED',
      surface: '#FFFFFF',
      text: {
        primary: '#3E3E3E',
        secondary: '#6B6B6B',
        disabled: '#9E9E9E'
      },
      status: {
        success: '#689F38',
        warning: '#F9A825',
        error: '#C62828',
        info: '#1565C0'
      },
      borders: '#E8E3DC'
    }
  }
}
