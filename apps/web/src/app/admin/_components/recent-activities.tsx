import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, ShoppingCart, UserPlus, MessageSquare, Calendar } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "email",
    title: "Email campaign sent",
    description: "Summer Sale campaign sent to 12,450 contacts",
    time: "2 hours ago",
    icon: Mail,
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: 2,
    type: "order",
    title: "New order received",
    description: "Order #1234 from John Doe - $156.99",
    time: "3 hours ago",
    icon: ShoppingCart,
    color: "bg-green-100 text-green-800",
  },
  {
    id: 3,
    type: "contact",
    title: "New contact added",
    description: "Jane Smith joined via website form",
    time: "4 hours ago",
    icon: UserPlus,
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: 4,
    type: "call",
    title: "Call scheduled",
    description: "Follow-up call with ABC Corp scheduled",
    time: "5 hours ago",
    icon: Calendar,
    color: "bg-orange-100 text-orange-800",
  },
  {
    id: 5,
    type: "chat",
    title: "Live chat session",
    description: "Support chat with customer about shipping",
    time: "6 hours ago",
    icon: MessageSquare,
    color: "bg-indigo-100 text-indigo-800",
  },
]

export function RecentActivities() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
        <CardDescription>Latest activities across your business</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <div className={`p-2 rounded-full ${activity.color}`}>
                <activity.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{activity.title}</p>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
