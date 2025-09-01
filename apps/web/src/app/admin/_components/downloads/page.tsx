"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Download,
  Search,
  Filter,
  MoreHorizontal,
  FileText,
  ImageIcon,
  Music,
  Video,
  Archive,
  Eye,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const downloadStats = [
  {
    title: "Total Downloads",
    value: "12,847",
    change: "+12.5%",
    trend: "up",
    icon: Download,
  },
  {
    title: "Active Products",
    value: "156",
    change: "+3.2%",
    trend: "up",
    icon: FileText,
  },
  {
    title: "Revenue",
    value: "$45,231",
    change: "+8.7%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    title: "Avg. File Size",
    value: "24.5 MB",
    change: "-2.1%",
    trend: "down",
    icon: Archive,
  },
]

const digitalProducts = [
  {
    id: "DP001",
    name: "Premium UI Kit",
    type: "Design",
    fileType: "ZIP",
    size: "45.2 MB",
    downloads: 1247,
    revenue: "$12,470",
    status: "active",
    lastUpdated: "2024-01-15",
    customer: {
      name: "Sarah Johnson",
      email: "sarah@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
  },
  {
    id: "DP002",
    name: "Stock Photo Bundle",
    type: "Photography",
    fileType: "ZIP",
    size: "128.7 MB",
    downloads: 892,
    revenue: "$8,920",
    status: "active",
    lastUpdated: "2024-01-14",
    customer: {
      name: "Mike Chen",
      email: "mike@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
  },
  {
    id: "DP003",
    name: "Audio Samples Pack",
    type: "Audio",
    fileType: "ZIP",
    size: "67.3 MB",
    downloads: 634,
    revenue: "$6,340",
    status: "active",
    lastUpdated: "2024-01-13",
    customer: {
      name: "Alex Rivera",
      email: "alex@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
  },
  {
    id: "DP004",
    name: "Video Tutorial Series",
    type: "Education",
    fileType: "MP4",
    size: "2.1 GB",
    downloads: 456,
    revenue: "$9,120",
    status: "pending",
    lastUpdated: "2024-01-12",
    customer: {
      name: "Emma Davis",
      email: "emma@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
  },
  {
    id: "DP005",
    name: "E-book Collection",
    type: "Literature",
    fileType: "PDF",
    size: "12.8 MB",
    downloads: 789,
    revenue: "$3,945",
    status: "active",
    lastUpdated: "2024-01-11",
    customer: {
      name: "David Wilson",
      email: "david@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
  },
]

const recentDownloads = [
  {
    id: "DL001",
    product: "Premium UI Kit",
    customer: "Sarah Johnson",
    downloadTime: "2 minutes ago",
    fileSize: "45.2 MB",
    status: "completed",
  },
  {
    id: "DL002",
    product: "Stock Photo Bundle",
    customer: "Mike Chen",
    downloadTime: "15 minutes ago",
    fileSize: "128.7 MB",
    status: "completed",
  },
  {
    id: "DL003",
    product: "Audio Samples Pack",
    customer: "Alex Rivera",
    downloadTime: "1 hour ago",
    fileSize: "67.3 MB",
    status: "failed",
  },
  {
    id: "DL004",
    product: "Video Tutorial Series",
    customer: "Emma Davis",
    downloadTime: "2 hours ago",
    fileSize: "2.1 GB",
    status: "in-progress",
  },
]

const getFileIcon = (fileType: string) => {
  switch (fileType.toLowerCase()) {
    case "pdf":
      return FileText
    case "zip":
      return Archive
    case "mp4":
      return Video
    case "mp3":
      return Music
    case "jpg":
    case "png":
      return ImageIcon
    default:
      return FileText
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800">Active</Badge>
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    case "inactive":
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
    case "completed":
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>
    case "failed":
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>
    case "in-progress":
      return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function DownloadsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Digital Downloads</h1>
          <p className="text-muted-foreground">Manage your digital products and track download activity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button>Add Digital Product</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {downloadStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs">
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>{stat.change}</span>
                <span className="text-muted-foreground ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Digital Products</TabsTrigger>
          <TabsTrigger value="downloads">Recent Downloads</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Digital Products</CardTitle>
                  <CardDescription>Manage your downloadable products and track performance</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search products..." className="pl-8 w-[300px]" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {digitalProducts.map((product) => {
                    const FileIcon = getFileIcon(product.fileType)
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                              <FileIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">{product.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{product.size}</TableCell>
                        <TableCell>
                          <div className="font-medium">{product.downloads.toLocaleString()}</div>
                        </TableCell>
                        <TableCell className="font-medium">{product.revenue}</TableCell>
                        <TableCell>{getStatusBadge(product.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{product.lastUpdated}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Download File
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Edit Product</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Delete Product</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="downloads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Download Activity</CardTitle>
              <CardDescription>Track customer download activity and status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Download Time</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDownloads.map((download) => (
                    <TableRow key={download.id}>
                      <TableCell className="font-medium">{download.product}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src="/placeholder.svg?height=24&width=24" />
                            <AvatarFallback>{download.customer.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {download.customer}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{download.downloadTime}</TableCell>
                      <TableCell className="font-mono text-sm">{download.fileSize}</TableCell>
                      <TableCell>{getStatusBadge(download.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Download Trends</CardTitle>
                <CardDescription>Downloads over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Download trends chart would be rendered here
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular File Types</CardTitle>
                <CardDescription>Most downloaded file formats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>ZIP Archives</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>PDF Documents</span>
                    <span className="font-medium">28%</span>
                  </div>
                  <Progress value={28} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Video Files</span>
                    <span className="font-medium">18%</span>
                  </div>
                  <Progress value={18} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Audio Files</span>
                    <span className="font-medium">9%</span>
                  </div>
                  <Progress value={9} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
              <CardDescription>Digital products with highest download rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {digitalProducts.slice(0, 3).map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.type}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{product.downloads.toLocaleString()} downloads</div>
                      <div className="text-sm text-muted-foreground">{product.revenue} revenue</div>
                    </div>
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
