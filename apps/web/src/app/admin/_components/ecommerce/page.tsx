import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
} from "lucide-react"

export default function EcommerceDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">E-Commerce Dashboard</h1>
          <p className="text-muted-foreground">Monitor your store performance and customer behavior</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Data</Button>
          <Button>View Reports</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +20.1% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2,350</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +180.1% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12,234</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +19% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <div className="flex items-center text-xs text-red-600">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              -0.5% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Revenue and orders over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Sales chart would be rendered here
            </div>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where your visitors are coming from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Organic Search</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">54.2%</div>
                <div className="text-xs text-muted-foreground">12,847 visits</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Direct</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">23.1%</div>
                <div className="text-xs text-muted-foreground">5,467 visits</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Social Media</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">12.8%</div>
                <div className="text-xs text-muted-foreground">3,024 visits</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Email</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">9.9%</div>
                <div className="text-xs text-muted-foreground">2,341 visits</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best performing products this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="text-sm font-medium">Wireless Headphones</div>
                <div className="text-xs text-muted-foreground">Electronics</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">$12,450</div>
                <div className="text-xs text-green-600">+15.2%</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="text-sm font-medium">Smart Watch</div>
                <div className="text-xs text-muted-foreground">Wearables</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">$8,920</div>
                <div className="text-xs text-green-600">+8.7%</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="text-sm font-medium">Laptop Stand</div>
                <div className="text-xs text-muted-foreground">Accessories</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">$5,680</div>
                <div className="text-xs text-red-600">-2.1%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Segments */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
            <CardDescription>Customer breakdown by type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>New Customers</span>
                <span className="font-medium">45%</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Returning Customers</span>
                <span className="font-medium">35%</span>
              </div>
              <Progress value={35} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>VIP Customers</span>
                <span className="font-medium">20%</span>
              </div>
              <Progress value={20} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>How customers access your store</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Desktop</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">52.3%</div>
                <div className="text-xs text-muted-foreground">12,389 visits</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-green-500" />
                <span className="text-sm">Mobile</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">38.7%</div>
                <div className="text-xs text-muted-foreground">9,156 visits</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tablet className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Tablet</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">9.0%</div>
                <div className="text-xs text-muted-foreground">2,134 visits</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Data */}
      <Card>
        <CardHeader>
          <CardTitle>Geographic Performance</CardTitle>
          <CardDescription>Revenue by location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <span className="text-sm">United States</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">$18,450</div>
                <div className="text-xs text-muted-foreground">40.8%</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-green-500" />
                <span className="text-sm">Canada</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">$8,920</div>
                <div className="text-xs text-muted-foreground">19.7%</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">United Kingdom</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">$6,780</div>
                <div className="text-xs text-muted-foreground">15.0%</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Australia</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">$4,560</div>
                <div className="text-xs text-muted-foreground">10.1%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
