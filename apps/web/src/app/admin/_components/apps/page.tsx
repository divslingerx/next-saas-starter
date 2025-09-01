"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Search,
  Star,
  Download,
  Settings,
  Trash2,
  MoreHorizontal,
  Zap,
  ShoppingCart,
  BarChart3,
  Mail,
  Truck,
  CreditCard,
  Package,
  TrendingUp,
  Headphones,
} from "lucide-react"

const installedApps = [
  {
    id: 1,
    name: "Klaviyo Email Marketing",
    developer: "Klaviyo",
    category: "Marketing",
    description: "Advanced email marketing and automation platform",
    icon: "/placeholder.svg?height=60&width=60",
    rating: 4.8,
    reviews: 2340,
    price: "$20/month",
    status: "active",
    lastUpdated: "2024-01-15",
    features: ["Email automation", "Segmentation", "Analytics"],
  },
  {
    id: 2,
    name: "Oberlo Dropshipping",
    developer: "Oberlo",
    category: "Inventory",
    description: "Find products to sell online and import them to your store",
    icon: "/placeholder.svg?height=60&width=60",
    rating: 4.6,
    reviews: 1890,
    price: "Free",
    status: "active",
    lastUpdated: "2024-01-12",
    features: ["Product import", "Order fulfillment", "Supplier network"],
  },
  {
    id: 3,
    name: "Google Analytics",
    developer: "Google",
    category: "Analytics",
    description: "Track your store's performance with detailed analytics",
    icon: "/placeholder.svg?height=60&width=60",
    rating: 4.9,
    reviews: 5670,
    price: "Free",
    status: "active",
    lastUpdated: "2024-01-10",
    features: ["Traffic analysis", "Conversion tracking", "Custom reports"],
  },
  {
    id: 4,
    name: "Yotpo Reviews",
    developer: "Yotpo",
    category: "Marketing",
    description: "Collect and display customer reviews and ratings",
    icon: "/placeholder.svg?height=60&width=60",
    rating: 4.7,
    reviews: 3450,
    price: "$29/month",
    status: "inactive",
    lastUpdated: "2024-01-08",
    features: ["Review collection", "Photo reviews", "Q&A"],
  },
]

const availableApps = [
  {
    id: 5,
    name: "Mailchimp",
    developer: "Mailchimp",
    category: "Marketing",
    description: "Email marketing, automation, and audience management",
    icon: "/placeholder.svg?height=60&width=60",
    rating: 4.5,
    reviews: 8900,
    price: "$10/month",
    features: ["Email campaigns", "Automation", "Landing pages"],
    popular: true,
  },
  {
    id: 6,
    name: "ShipStation",
    developer: "ShipStation",
    category: "Shipping",
    description: "Multi-carrier shipping software for e-commerce",
    icon: "/placeholder.svg?height=60&width=60",
    rating: 4.8,
    reviews: 4560,
    price: "$9/month",
    features: ["Multi-carrier shipping", "Label printing", "Order management"],
    popular: false,
  },
  {
    id: 7,
    name: "Stripe Payment Gateway",
    developer: "Stripe",
    category: "Payments",
    description: "Accept payments online with Stripe's secure platform",
    icon: "/placeholder.svg?height=60&width=60",
    rating: 4.9,
    reviews: 12340,
    price: "2.9% + 30¢",
    features: ["Credit cards", "Digital wallets", "International payments"],
    popular: true,
  },
  {
    id: 8,
    name: "Zendesk Chat",
    developer: "Zendesk",
    category: "Customer Service",
    description: "Live chat and customer support for your store",
    icon: "/placeholder.svg?height=60&width=60",
    rating: 4.6,
    reviews: 2890,
    price: "$14/month",
    features: ["Live chat", "Chatbots", "Help desk"],
    popular: false,
  },
  {
    id: 9,
    name: "Instagram Feed",
    developer: "Elfsight",
    category: "Marketing",
    description: "Display your Instagram feed on your store",
    icon: "/placeholder.svg?height=60&width=60",
    rating: 4.4,
    reviews: 1560,
    price: "$5/month",
    features: ["Instagram integration", "Customizable layouts", "Auto-sync"],
    popular: false,
  },
  {
    id: 10,
    name: "PageSpeed Monitor",
    developer: "TinyIMG",
    category: "SEO",
    description: "Monitor and optimize your store's loading speed",
    icon: "/placeholder.svg?height=60&width=60",
    rating: 4.7,
    reviews: 890,
    price: "$19/month",
    features: ["Speed monitoring", "Image optimization", "SEO analysis"],
    popular: false,
  },
]

const categories = [
  { name: "All", count: 150, icon: Zap },
  { name: "Marketing", count: 45, icon: Mail },
  { name: "Sales", count: 32, icon: ShoppingCart },
  { name: "Analytics", count: 28, icon: BarChart3 },
  { name: "Shipping", count: 24, icon: Truck },
  { name: "Payments", count: 18, icon: CreditCard },
  { name: "Customer Service", count: 15, icon: Headphones },
  { name: "Inventory", count: 12, icon: Package },
  { name: "SEO", count: 8, icon: TrendingUp },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800"
    case "inactive":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Marketing":
      return <Mail className="w-4 h-4" />
    case "Analytics":
      return <BarChart3 className="w-4 h-4" />
    case "Inventory":
      return <Package className="w-4 h-4" />
    case "Shipping":
      return <Truck className="w-4 h-4" />
    case "Payments":
      return <CreditCard className="w-4 h-4" />
    case "Customer Service":
      return <Headphones className="w-4 h-4" />
    case "SEO":
      return <TrendingUp className="w-4 h-4" />
    default:
      return <Zap className="w-4 h-4" />
  }
}

export default function Apps() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const filteredAvailableApps = availableApps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || app.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const totalApps = installedApps.length
  const activeApps = installedApps.filter((app) => app.status === "active").length
  const monthlySpend = installedApps.reduce((sum, app) => {
    const price = app.price.replace(/[^0-9.]/g, "")
    return sum + (price ? Number.parseFloat(price) : 0)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apps</h1>
          <p className="text-muted-foreground">
            Extend your store's functionality with powerful apps and integrations.
          </p>
        </div>
        <Button>
          <Search className="w-4 h-4 mr-2" />
          Browse apps
        </Button>
      </div>

      {/* Apps Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Installed Apps</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApps}</div>
            <p className="text-xs text-muted-foreground">{activeApps} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlySpend}</div>
            <p className="text-xs text-muted-foreground">App subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Apps</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,500+</div>
            <p className="text-xs text-muted-foreground">In app store</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.7</div>
            <p className="text-xs text-muted-foreground">Installed apps</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="installed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="installed">Installed apps</TabsTrigger>
          <TabsTrigger value="browse">Browse apps</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Apps</CardTitle>
              <CardDescription>Manage your installed apps and subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {installedApps.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={app.icon || "/placeholder.svg"} alt={app.name} />
                        <AvatarFallback>{app.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{app.name}</h3>
                          <Badge className={getStatusColor(app.status)} variant="secondary">
                            {app.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{app.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>by {app.developer}</span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {app.rating} ({app.reviews})
                          </span>
                          <span>{app.price}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Uninstall
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browse" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search apps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {getCategoryIcon(selectedCategory)}
                  <span className="ml-2">{selectedCategory}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {categories.map((category) => (
                  <DropdownMenuItem key={category.name} onSelect={() => setSelectedCategory(category.name)}>
                    <category.icon className="w-4 h-4 mr-2" />
                    {category.name} ({category.count})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAvailableApps.map((app) => (
              <Card key={app.id} className="relative">
                {app.popular && (
                  <Badge className="absolute top-2 right-2 bg-orange-100 text-orange-800" variant="secondary">
                    Popular
                  </Badge>
                )}
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={app.icon || "/placeholder.svg"} alt={app.name} />
                      <AvatarFallback>{app.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{app.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">by {app.developer}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{app.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{app.rating}</span>
                      <span className="text-sm text-muted-foreground">({app.reviews})</span>
                    </div>
                    <span className="font-medium">{app.price}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {app.features.slice(0, 2).map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {app.features.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{app.features.length - 2}
                      </Badge>
                    )}
                  </div>
                  <Button className="w-full">Install app</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>App Categories</CardTitle>
              <CardDescription>Browse apps by category to find what you need</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    <div className="flex items-center gap-3">
                      <category.icon className="w-5 h-5" />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <Badge variant="outline">{category.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
