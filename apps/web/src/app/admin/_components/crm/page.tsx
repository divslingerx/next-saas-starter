import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Users,
  Target,
  DollarSign,
  TrendingUp,
  Phone,
  Calendar,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

export default function CRMDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM Dashboard</h1>
          <p className="text-muted-foreground">Track your sales performance and customer relationships</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Report</Button>
          <Button>Add Deal</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +12.5% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +8.2% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$284,750</div>
            <div className="flex items-center text-xs text-red-600">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              -3.1% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.8%</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +2.3% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Pipeline</CardTitle>
            <CardDescription>Active deals by stage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Qualified (12 deals)</span>
                <span className="font-medium">$89,400</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Proposal (8 deals)</span>
                <span className="font-medium">$67,200</span>
              </div>
              <Progress value={60} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Negotiation (15 deals)</span>
                <span className="font-medium">$94,800</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Closed Won (12 deals)</span>
                <span className="font-medium">$33,350</span>
              </div>
              <Progress value={90} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
            <CardDescription>Where your leads are coming from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Website</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">847</div>
                <div className="text-xs text-muted-foreground">42.3%</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Referrals</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">523</div>
                <div className="text-xs text-muted-foreground">26.1%</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Social Media</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">389</div>
                <div className="text-xs text-muted-foreground">19.4%</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Email Campaign</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">245</div>
                <div className="text-xs text-muted-foreground">12.2%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Activities</CardTitle>
            <CardDescription>Your scheduled tasks and meetings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Phone className="h-4 w-4 text-blue-500" />
              <div className="flex-1">
                <div className="text-sm font-medium">Call with Acme Corp</div>
                <div className="text-xs text-muted-foreground">Today at 2:00 PM</div>
              </div>
              <Badge variant="outline">High</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Calendar className="h-4 w-4 text-green-500" />
              <div className="flex-1">
                <div className="text-sm font-medium">Product Demo - TechStart</div>
                <div className="text-xs text-muted-foreground">Tomorrow at 10:00 AM</div>
              </div>
              <Badge variant="outline">Medium</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Mail className="h-4 w-4 text-purple-500" />
              <div className="flex-1">
                <div className="text-sm font-medium">Follow up - GlobalTech</div>
                <div className="text-xs text-muted-foreground">Friday at 9:00 AM</div>
              </div>
              <Badge variant="outline">Low</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Sales team performance this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">JS</span>
                </div>
                <div>
                  <div className="text-sm font-medium">John Smith</div>
                  <div className="text-xs text-muted-foreground">Senior Sales Rep</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">$45,200</div>
                <div className="text-xs text-green-600">+18.5%</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-green-600">MJ</span>
                </div>
                <div>
                  <div className="text-sm font-medium">Maria Johnson</div>
                  <div className="text-xs text-muted-foreground">Account Manager</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">$38,900</div>
                <div className="text-xs text-green-600">+12.3%</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-600">RW</span>
                </div>
                <div>
                  <div className="text-sm font-medium">Robert Wilson</div>
                  <div className="text-xs text-muted-foreground">Sales Rep</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">$32,150</div>
                <div className="text-xs text-green-600">+8.7%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
