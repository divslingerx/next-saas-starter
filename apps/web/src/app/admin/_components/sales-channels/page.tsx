"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Globe,
  Facebook,
  Instagram,
  ShoppingBag,
  Smartphone,
  MoreHorizontal,
  Settings,
  BarChart3,
  Plus,
  ExternalLink,
} from "lucide-react"

const salesChannels = [
  {
    id: 1,
    name: "Online Store",
    description: "Your main e-commerce website",
    icon: Globe,
    status: "active",
    isEnabled: true,
    orders: 1234,
    revenue: "$45,231.89",
    conversionRate: 3.2,
    traffic: 15420,
    color: "bg-blue-500",
  },
  {
    id: 2,
    name: "Facebook Shop",
    description: "Sell directly on Facebook",
    icon: Facebook,
    status: "active",
    isEnabled: true,
    orders: 89,
    revenue: "$3,456.78",
    conversionRate: 2.1,
    traffic: 4230,
    color: "bg-blue-600",
  },
  {
    id: 3,
    name: "Instagram Shopping",
    description: "Tag products in Instagram posts",
    icon: Instagram,
    status: "active",
    isEnabled: true,
    orders: 156,
    revenue: "$5,678.90",
    conversionRate: 4.5,
    traffic: 3460,
    color: "bg-pink-500",
  },
  {
    id: 4,
    name: "Amazon",
    description: "Sell on Amazon marketplace",
    icon: ShoppingBag,
    status: "pending",
    isEnabled: false,
    orders: 0,
    revenue: "$0.00",
    conversionRate: 0,
    traffic: 0,
    color: "bg-orange-500",
  },
  {
    id: 5,
    name: "Mobile App",
    description: "Your branded mobile application",
    icon: Smartphone,
    status: "draft",
    isEnabled: false,
    orders: 0,
    revenue: "$0.00",
    conversionRate: 0,
    traffic: 0,
    color: "bg-green-500",
  },
]

const availableChannels = [
  { name: "Google Shopping", description: "Reach customers on Google", icon: Globe },
  { name: "eBay", description: "Sell on eBay marketplace", icon: ShoppingBag },
  { name: "TikTok Shop", description: "Sell through TikTok", icon: Smartphone },
  { name: "Pinterest", description: "Showcase products on Pinterest", icon: Instagram },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800"
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "draft":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function SalesChannels() {
  const [channels, setChannels] = useState(salesChannels)

  const toggleChannel = (id: number) => {
    setChannels(
      channels.map((channel) => (channel.id === id ? { ...channel, isEnabled: !channel.isEnabled } : channel)),
    )
  }

  const totalRevenue = channels.reduce((sum, channel) => {
    const revenue = Number.parseFloat(channel.revenue.replace("$", "").replace(",", ""))
    return sum + revenue
  }, 0)

  const totalOrders = channels.reduce((sum, channel) => sum + channel.orders, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales channels</h1>
          <p className="text-muted-foreground">Manage where and how you sell your products.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add sales channel
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all channels</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all channels</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Channels</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channels.filter((c) => c.isEnabled).length}</div>
            <p className="text-xs text-muted-foreground">Currently selling</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Sales Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Your sales channels</CardTitle>
          <CardDescription>Manage your existing sales channels and their performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {channels.map((channel) => (
            <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${channel.color} text-white`}>
                  <channel.icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{channel.name}</h3>
                    <Badge className={getStatusColor(channel.status)} variant="secondary">
                      {channel.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{channel.description}</p>
                  {channel.isEnabled && (
                    <div className="flex items-center gap-4 text-sm">
                      <span>{channel.orders} orders</span>
                      <span>{channel.revenue} revenue</span>
                      <span>{channel.conversionRate}% conversion</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={channel.isEnabled} onCheckedChange={() => toggleChannel(channel.id)} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View analytics
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit channel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Available Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Available sales channels</CardTitle>
          <CardDescription>Expand your reach by adding new sales channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {availableChannels.map((channel, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <channel.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{channel.name}</h3>
                    <p className="text-sm text-muted-foreground">{channel.description}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
