"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Package,
  ShoppingCart,
  Users,
  Settings,
  Home,
  CreditCard,
  Truck,
  Tag,
  FileText,
  Megaphone,
  Zap,
  Mail,
  Workflow,
  Target,
  Calendar,
  MessageSquare,
  Building,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Phone,
  Headphones,
  Instagram,
  Facebook,
  Twitter,
  Send,
  Layers,
  BarChart3,
  Download,
} from "lucide-react"

const navigation = [
  // Top-level items
  { name: "Dashboard", href: "/", icon: Home },

  // E-commerce
  {
    group: "E-commerce",
    items: [
      { name: "Dashboard", href: "/ecommerce", icon: BarChart3 },
      { name: "Orders", href: "/orders", icon: ShoppingCart },
      { name: "Downloads", href: "/downloads", icon: Download },
      { name: "Products", href: "/products", icon: Package },
      { name: "Discounts", href: "/discounts", icon: Tag },
      { name: "Shipping", href: "/shipping", icon: Truck },
      { name: "Sales Channels", href: "/sales-channels", icon: CreditCard },
    ],
  },
  // CRM & Customers
  {
    group: "CRM & Customers",
    items: [
      { name: "Dashboard", href: "/crm", icon: BarChart3 },
      { name: "Contacts", href: "/customers", icon: Users },
      { name: "Companies", href: "/companies", icon: Building },
      { name: "Deals", href: "/deals", icon: Target },
      {
        name: "Activities",
        icon: Calendar,
        children: [
          { name: "All Activities", href: "/activities", icon: Calendar },
          { name: "Calls", href: "/activities/calls", icon: Phone },
          { name: "Meetings", href: "/activities/meetings", icon: Users },
          { name: "Tasks", href: "/activities/tasks", icon: Target },
        ],
      },
      { name: "Support", href: "/support", icon: Headphones },
    ],
  },
  // Marketing & Automation
  {
    group: "Marketing",
    items: [
      { name: "Campaigns", href: "/marketing", icon: Megaphone },
      {
        name: "Email Marketing",
        icon: Mail,
        children: [
          { name: "Campaigns", href: "/email/campaigns", icon: Send },
          { name: "Templates", href: "/email/templates", icon: Layers },
          { name: "Lists", href: "/email/lists", icon: Users },
          { name: "Automation", href: "/email/automation", icon: Workflow },
        ],
      },
      { name: "Workflows", href: "/workflows", icon: Workflow },
      { name: "Lead Scoring", href: "/lead-scoring", icon: TrendingUp },
      {
        name: "Social Media",
        icon: MessageSquare,
        children: [
          { name: "Posts", href: "/social/posts", icon: MessageSquare },
          { name: "Facebook", href: "/social/facebook", icon: Facebook },
          { name: "Instagram", href: "/social/instagram", icon: Instagram },
          { name: "Twitter", href: "/social/twitter", icon: Twitter },
        ],
      },
    ],
  },
  // Operations
  {
    group: "Operations",
    items: [
      { name: "Finances", href: "/finances", icon: FileText },
      { name: "Apps", href: "/apps", icon: Zap },
    ],
  },
  // Settings
  {
    group: "Settings",
    items: [
      { name: "General", href: "/settings", icon: Settings },
      { name: "Team", href: "/settings/team", icon: Users },
      { name: "Integrations", href: "/settings/integrations", icon: Zap },
      { name: "Security", href: "/settings/security", icon: UserCheck },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleGroupExpanded = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName) ? prev.filter((name) => name !== groupName) : [...prev, groupName],
    )
  }

  const toggleItemExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName],
    )
  }

  const isGroupActive = (group: any) => {
    return group.items.some((item: any) => {
      if (item.href) {
        return pathname === item.href
      }
      if (item.children) {
        return item.children.some((child: any) => pathname === child.href)
      }
      return false
    })
  }

  const isItemActive = (item: any) => {
    if (item.href) {
      return pathname === item.href
    }
    if (item.children) {
      return item.children.some((child: any) => pathname === child.href)
    }
    return false
  }

  const isChildActive = (child: any) => {
    return pathname === child.href
  }

  return (
    <div className="w-64 bg-card border-r border-border">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <h2 className="font-semibold">SceneKeeper</h2>
            <p className="text-xs text-muted-foreground">mystore.scenekeeper.com</p>
          </div>
        </div>
      </div>

      <nav className="px-3 space-y-2">
        {navigation.map((navItem, index) => {
          // Handle simple top-level items (Dashboard)
          if (!navItem.group && !navItem.children) {
            const isActive = pathname === navItem.href
            return (
              <Link
                key={navItem.name}
                href={navItem.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <navItem.icon className="w-4 h-4" />
                {navItem.name}
              </Link>
            )
          }

          // Handle grouped items
          const group = navItem
          const isGroupExpanded = expandedGroups.includes(group.group)
          const isActive = isGroupActive(group)

          return (
            <div key={group.group}>
              <button
                onClick={() => toggleGroupExpanded(group.group)}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <span>{group.group}</span>
                {isGroupExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>

              {isGroupExpanded && (
                <div className="mt-2 space-y-1">
                  {group.items.map((item) => {
                    const isItemActiveState = isItemActive(item)
                    const isItemExpanded = expandedItems.includes(item.name)
                    const hasChildren = item.children && item.children.length > 0

                    return (
                      <div key={item.name}>
                        {hasChildren ? (
                          <button
                            onClick={() => toggleItemExpanded(item.name)}
                            className={cn(
                              "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                              isItemActiveState
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className="w-4 h-4" />
                              {item.name}
                            </div>
                            {isItemExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                              isItemActiveState
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted",
                            )}
                          >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                          </Link>
                        )}

                        {/* Children */}
                        {hasChildren && isItemExpanded && (
                          <div className="ml-6 mt-1 space-y-1">
                            {item.children.map((child: any) => (
                              <Link
                                key={child.name}
                                href={child.href}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                                  isChildActive(child)
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                                )}
                              >
                                <child.icon className="w-4 h-4" />
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}
