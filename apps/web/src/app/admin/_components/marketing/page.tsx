"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Plus,
  Mail,
  MessageSquare,
  Megaphone,
  BarChart3,
  Users,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  TrendingUp,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Smartphone,
} from "lucide-react"

const campaigns = [
  {
    id: 1,
    name: "Summer Sale 2024",
    type: "email",
    status: "active",
    audience: 12450,
    sent: 12450,
    opened: 3735,
    clicked: 448,
    revenue: "$15,670",
    startDate: "2024-01-15",
    endDate: "2024-02-15",
    openRate: 30,
    clickRate: 3.6,
  },
  {
    id: 2,
    name: "New Product Launch",
    type: "social",
    status: "scheduled",
    audience: 8900,
    sent: 0,
    opened: 0,
    clicked: 0,
    revenue: "$0",
    startDate: "2024-01-20",
    endDate: "2024-01-27",
    openRate: 0,
    clickRate: 0,
  },
  {
    id: 3,
    name: "Holiday Promotion",
    type: "sms",
    status: "completed",
    audience: 5600,
    sent: 5600,
    opened: 4480,
    clicked: 672,
    revenue: "$8,940",
    startDate: "2023-12-20",
    endDate: "2023-12-31",
    openRate: 80,
    clickRate: 12,
  },
  {
    id: 4,
    name: "Customer Retention",
    type: "email",
    status: "draft",
    audience: 3200,
    sent: 0,
    opened: 0,
    clicked: 0,
    revenue: "$0",
    startDate: "2024-02-01",
    endDate: "2024-02-28",
    openRate: 0,
    clickRate: 0,
  },
]

const automations = [
  {
    id: 1,
    name: "Welcome Series",
    trigger: "New subscriber",
    status: "active",
    emails: 3,
    subscribers: 1240,
    revenue: "$4,560",
    openRate: 45,
    clickRate: 8.2,
  },
  {
    id: 2,
    name: "Abandoned Cart",
    trigger: "Cart abandonment",
    status: "active",
    emails: 2,
    subscribers: 890,
    revenue: "$12,340",
    openRate: 35,
    clickRate: 12.5,
  },
  {
    id: 3,
    name: "Post-Purchase Follow-up",
    trigger: "Order completion",
    status: "active",
    emails: 4,
    subscribers: 567,
    revenue: "$2,890",
    openRate: 52,
    clickRate: 6.8,
  },
  {
    id: 4,
    name: "Win-back Campaign",
    trigger: "Inactive customer",
    status: "paused",
    emails: 2,
    subscribers: 234,
    revenue: "$890",
    openRate: 28,
    clickRate: 4.2,
  },
]

const socialAccounts = [
  {
    platform: "Facebook",
    handle: "@mystore",
    followers: 12500,
    engagement: 4.2,
    posts: 45,
    icon: Facebook,
    color: "bg-blue-600",
    connected: true,
  },
  {
    platform: "Instagram",
    handle: "@mystore",
    followers: 8900,
    engagement: 6.8,
    posts: 78,
    icon: Instagram,
    color: "bg-pink-500",
    connected: true,
  },
  {
    platform: "Twitter",
    handle: "@mystore",
    followers: 5600,
    engagement: 3.1,
    posts: 123,
    icon: Twitter,
    color: "bg-blue-400",
    connected: false,
  },
  {
    platform: "YouTube",
    handle: "@mystore",
    followers: 2300,
    engagement: 8.5,
    posts: 12,
    icon: Youtube,
    color: "bg-red-500",
    connected: false,
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800"
    case "scheduled":
      return "bg-blue-100 text-blue-800"
    case "completed":
      return "bg-gray-100 text-gray-800"
    case "draft":
      return "bg-yellow-100 text-yellow-800"
    case "paused":
      return "bg-orange-100 text-orange-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "email":
      return <Mail className="w-4 h-4" />
    case "sms":
      return <Smartphone className="w-4 h-4" />
    case "social":
      return <MessageSquare className="w-4 h-4" />
    default:
      return <Megaphone className="w-4 h-4" />
  }
}

export default function Marketing() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalCampaigns = campaigns.length
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length
  const totalRevenue = campaigns.reduce((sum, campaign) => {
    const revenue = Number.parseFloat(campaign.revenue.replace("$", "").replace(",", ""))
    return sum + revenue
  }, 0)
  const avgOpenRate = campaigns.reduce((sum, campaign) => sum + campaign.openRate, 0) / campaigns.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
          <p className="text-muted-foreground">Create and manage your marketing campaigns and automations.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create campaign
        </Button>
      </div>

      {/* Marketing Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">{activeCampaigns} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From marketing campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgOpenRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15,240</div>
            <p className="text-xs text-muted-foreground">Email subscribers</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Marketing Campaigns</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search campaigns..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(campaign.type)}
                          <span className="capitalize">{campaign.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(campaign.status)} variant="secondary">
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{campaign.audience.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            Open: {campaign.openRate}% • Click: {campaign.clickRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {campaign.opened.toLocaleString()} opens, {campaign.clicked.toLocaleString()} clicks
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{campaign.revenue}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{campaign.startDate}</div>
                          <div className="text-muted-foreground">to {campaign.endDate}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Automations</CardTitle>
              <CardDescription>Automated email sequences and workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Automation</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Emails</TableHead>
                    <TableHead>Subscribers</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {automations.map((automation) => (
                    <TableRow key={automation.id}>
                      <TableCell className="font-medium">{automation.name}</TableCell>
                      <TableCell>{automation.trigger}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(automation.status)} variant="secondary">
                          {automation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{automation.emails} emails</TableCell>
                      <TableCell>{automation.subscribers.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          Open: {automation.openRate}% • Click: {automation.clickRate}%
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{automation.revenue}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View workflow
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Analytics
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Accounts</CardTitle>
              <CardDescription>Connect and manage your social media presence</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {socialAccounts.map((account, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${account.color} text-white`}>
                        <account.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium">{account.platform}</div>
                        <div className="text-sm text-muted-foreground">{account.handle}</div>
                        {account.connected && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {account.followers.toLocaleString()} followers • {account.engagement}% engagement
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={account.connected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        variant="secondary"
                      >
                        {account.connected ? "Connected" : "Not connected"}
                      </Badge>
                      {account.connected ? (
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      ) : (
                        <Button size="sm">Connect</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Email Performance</CardTitle>
                <CardDescription>Email marketing metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Open Rate</span>
                    <span className="font-medium">32.5%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "32.5%" }} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Click Rate</span>
                    <span className="font-medium">4.8%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: "4.8%" }} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Unsubscribe Rate</span>
                    <span className="font-medium">0.2%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: "0.2%" }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaign ROI</CardTitle>
                <CardDescription>Return on investment by campaign type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>Email Campaigns</span>
                    </div>
                    <span className="font-medium text-green-600">420% ROI</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      <span>SMS Campaigns</span>
                    </div>
                    <span className="font-medium text-green-600">380% ROI</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>Social Media</span>
                    </div>
                    <span className="font-medium text-green-600">250% ROI</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
