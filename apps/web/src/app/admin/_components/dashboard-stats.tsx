import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowUpIcon,
  ArrowDownIcon,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Target,
  Mail,
  TrendingUp,
  UserCheck,
} from "lucide-react"

const stats = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1%",
    changeType: "increase" as const,
    icon: DollarSign,
  },
  {
    title: "Orders",
    value: "2,350",
    change: "+180.1%",
    changeType: "increase" as const,
    icon: ShoppingCart,
  },
  {
    title: "Active Contacts",
    value: "12,234",
    change: "+19%",
    changeType: "increase" as const,
    icon: Users,
  },
  {
    title: "Conversion Rate",
    value: "3.2%",
    change: "+0.5%",
    changeType: "increase" as const,
    icon: TrendingUp,
  },
  {
    title: "Open Deals",
    value: "156",
    change: "+12%",
    changeType: "increase" as const,
    icon: Target,
  },
  {
    title: "Email Open Rate",
    value: "24.5%",
    change: "-2.1%",
    changeType: "decrease" as const,
    icon: Mail,
  },
  {
    title: "Products",
    value: "573",
    change: "-4.3%",
    changeType: "decrease" as const,
    icon: Package,
  },
  {
    title: "Qualified Leads",
    value: "89",
    change: "+15.3%",
    changeType: "increase" as const,
    icon: UserCheck,
  },
]

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {stat.changeType === "increase" ? (
                <ArrowUpIcon className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownIcon className="h-3 w-3 text-red-500" />
              )}
              <span className={stat.changeType === "increase" ? "text-green-500" : "text-red-500"}>{stat.change}</span>
              from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
