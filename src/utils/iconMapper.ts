import { LucideIcon } from 'lucide-react'
import {
  FileText,
  Users,
  Settings,
  Plus,
  Heart,
  Calendar,
  Clock,
  TrendingUp,
  BarChart,
  PieChart,
  Activity,
  Award,
  Briefcase,
  Building,
  Building2,
  Calculator,
  CheckCircle,
  Clipboard,
  Cog,
  DollarSign,
  Download,
  Edit,
  Eye,
  Folder,
  Gift,
  Globe,
  Headphones,
  Home,
  Inbox,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Monitor,
  Package,
  Palette,
  Phone,
  Play,
  Printer,
  Save,
  Search,
  Share,
  Shield,
  ShoppingCart,
  Star,
  Tag,
  Target,
  ThumbsUp,
  TrendingDown,
  Upload,
  Video,
  Zap,
  Wrench
} from 'lucide-react'
import { IconName } from '../types/departmentLandingPage'

/**
 * Map of icon names to Lucide icon components
 */
export const iconMap: Record<IconName, LucideIcon> = {
  FileText,
  Users,
  Settings,
  Plus,
  Heart,
  Calendar,
  Clock,
  TrendingUp,
  BarChart,
  PieChart,
  Activity,
  Award,
  Briefcase,
  Building,
  Building2,
  Calculator,
  CheckCircle,
  Clipboard,
  Cog,
  DollarSign,
  Download,
  Edit,
  Eye,
  Folder,
  Gift,
  Globe,
  Headphones,
  Home,
  Inbox,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Monitor,
  Package,
  Palette,
  Phone,
  Play,
  Printer,
  Save,
  Search,
  Share,
  Shield,
  ShoppingCart,
  Star,
  Tag,
  Target,
  ThumbsUp,
  TrendingDown,
  Upload,
  Video,
  Zap,
  Wrench
}

/**
 * Get icon component from icon name
 * @param iconName Name of the icon
 * @returns Lucide icon component or default FileText icon
 */
export const getIconComponent = (iconName: string | null | undefined): LucideIcon => {
  if (!iconName) {
    return FileText
  }

  const icon = iconMap[iconName as IconName]
  if (!icon) {
    console.warn(`Icon "${iconName}" not found in iconMap. Using FileText as fallback.`)
    return FileText
  }

  return icon
}

/**
 * Get list of all available icon names
 * @returns Array of icon names
 */
export const getAvailableIcons = (): IconName[] => {
  return Object.keys(iconMap) as IconName[]
}

/**
 * Check if an icon name is valid
 * @param iconName Name to check
 * @returns true if icon exists in map
 */
export const isValidIconName = (iconName: string): iconName is IconName => {
  return iconName in iconMap
}

/**
 * Icon options for dropdowns/selectors with display names
 */
export const iconOptions: Array<{ value: IconName; label: string; icon: LucideIcon }> = [
  { value: 'FileText', label: 'Document', icon: FileText },
  { value: 'Users', label: 'Users', icon: Users },
  { value: 'Settings', label: 'Settings', icon: Settings },
  { value: 'Plus', label: 'Plus', icon: Plus },
  { value: 'Heart', label: 'Heart', icon: Heart },
  { value: 'Calendar', label: 'Calendar', icon: Calendar },
  { value: 'Clock', label: 'Clock', icon: Clock },
  { value: 'TrendingUp', label: 'Trending Up', icon: TrendingUp },
  { value: 'BarChart', label: 'Bar Chart', icon: BarChart },
  { value: 'PieChart', label: 'Pie Chart', icon: PieChart },
  { value: 'Activity', label: 'Activity', icon: Activity },
  { value: 'Award', label: 'Award', icon: Award },
  { value: 'Briefcase', label: 'Briefcase', icon: Briefcase },
  { value: 'Building', label: 'Building', icon: Building },
  { value: 'Building2', label: 'Building 2', icon: Building2 },
  { value: 'Calculator', label: 'Calculator', icon: Calculator },
  { value: 'CheckCircle', label: 'Check Circle', icon: CheckCircle },
  { value: 'Clipboard', label: 'Clipboard', icon: Clipboard },
  { value: 'Cog', label: 'Cog', icon: Cog },
  { value: 'DollarSign', label: 'Dollar Sign', icon: DollarSign },
  { value: 'Download', label: 'Download', icon: Download },
  { value: 'Edit', label: 'Edit', icon: Edit },
  { value: 'Eye', label: 'Eye', icon: Eye },
  { value: 'Folder', label: 'Folder', icon: Folder },
  { value: 'Gift', label: 'Gift', icon: Gift },
  { value: 'Globe', label: 'Globe', icon: Globe },
  { value: 'Headphones', label: 'Headphones', icon: Headphones },
  { value: 'Home', label: 'Home', icon: Home },
  { value: 'Inbox', label: 'Inbox', icon: Inbox },
  { value: 'Mail', label: 'Mail', icon: Mail },
  { value: 'MapPin', label: 'Map Pin', icon: MapPin },
  { value: 'Megaphone', label: 'Megaphone', icon: Megaphone },
  { value: 'MessageCircle', label: 'Message', icon: MessageCircle },
  { value: 'Monitor', label: 'Monitor', icon: Monitor },
  { value: 'Package', label: 'Package', icon: Package },
  { value: 'Palette', label: 'Palette', icon: Palette },
  { value: 'Phone', label: 'Phone', icon: Phone },
  { value: 'Play', label: 'Play', icon: Play },
  { value: 'Printer', label: 'Printer', icon: Printer },
  { value: 'Save', label: 'Save', icon: Save },
  { value: 'Search', label: 'Search', icon: Search },
  { value: 'Share', label: 'Share', icon: Share },
  { value: 'Shield', label: 'Shield', icon: Shield },
  { value: 'ShoppingCart', label: 'Shopping Cart', icon: ShoppingCart },
  { value: 'Star', label: 'Star', icon: Star },
  { value: 'Tag', label: 'Tag', icon: Tag },
  { value: 'Target', label: 'Target', icon: Target },
  { value: 'ThumbsUp', label: 'Thumbs Up', icon: ThumbsUp },
  { value: 'TrendingDown', label: 'Trending Down', icon: TrendingDown },
  { value: 'Upload', label: 'Upload', icon: Upload },
  { value: 'Video', label: 'Video', icon: Video },
  { value: 'Zap', label: 'Zap', icon: Zap },
  { value: 'Wrench', label: 'Wrench', icon: Wrench }
]
