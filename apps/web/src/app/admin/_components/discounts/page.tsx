"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Percent,
  DollarSign,
  Truck,
  Users,
  TrendingUp,
} from "lucide-react"

const discountCodes = [
  {
    id: 1,
    code: "WELCOME10",
    type: "percentage",
    value: "10%",
    description: "Welcome discount for new customers",
    status: "active",
    uses: 234,
    limit: 1000,
    revenue: "$2,340.00",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    minOrder: "$50.00",
  },
  {
    id: 2,
    code: "FREESHIP",
    type: "free_shipping",
    value: "Free shipping",
    description: "Free shipping on orders over $100",
    status: "active",
    uses: 456,
    limit: null,
    revenue: "$4,560.00",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    minOrder: "$100.00",
  },
  {
    id: 3,
    code: "SAVE25",
    type: "fixed_amount",
    value: "$25",
    description: "Fixed $25 off any order",
    status: "active",
    uses: 89,
    limit: 500,
    revenue: "$2,225.00",
    startDate: "2024-01-15",
    endDate: "2024-02-15",
    minOrder: "$75.00",
  },
  {
    id: 4,
    code: "EXPIRED20",
    type: "percentage",
    value: "20%",
    description: "Holiday discount (expired)",
    status: "expired",
    uses: 567,
    limit: 1000,
    revenue: "$11,340.00",
    startDate: "2023-12-01",
    endDate: "2023-12-31",
    minOrder: "$30.00",
  },
  {
    id: 5,
    code: "DRAFT15",
    type: "percentage",
    value: "15%",
    description: "Spring sale discount (draft)",
    status: "draft",
    uses: 0,
    limit: 750,
    revenue: "$0.00",
    startDate: "2024-03-01",
    endDate: "2024-03-31",
    minOrder: "$40.00",
  },
]

const automaticDiscounts = [
  {
    id: 1,
    name: "Buy 2 Get 1 Free",
    type: "buy_x_get_y",
    description: "Buy 2 items, get 1 free",
    status: "active",
    uses: 123,
    revenue: "$1,845.00",
    conditions: "Minimum 2 items",
  },
  {
    id: 2,
    name: "Volume Discount",
    type: "quantity",
    description: "10% off when buying 5+ items",
    status: "active",
    uses: 67,
    revenue: "$670.00",
    conditions: "Minimum 5 quantity",
  },
  {
    id: 3,
    name: "VIP Customer Discount",
    type: "customer_group",
    description: "15% off for VIP customers",
    status: "active",
    uses: 45,
    revenue: "$675.00",
    conditions: "VIP customer tag",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800"
    case "expired":
      return "bg-red-100 text-red-800"
    case "draft":
      return "bg-gray-100 text-gray-800"
    case "scheduled":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "percentage":
      return <Percent className="w-4 h-4" />
    case "fixed_amount":
      return <DollarSign className="w-4 h-4" />
    case "free_shipping":
      return <Truck className="w-4 h-4" />
    case "buy_x_get_y":
    case "quantity":
    case "customer_group":
      return <Users className="w-4 h-4" />
    default:
      return <Percent className="w-4 h-4" />
  }
}

export default function Discounts() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredDiscounts = discountCodes.filter(
    (discount) =>
      discount.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discount.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalDiscountRevenue = discountCodes.reduce((sum, discount) => {
    const revenue = Number.parseFloat(discount.revenue.replace("$", "").replace(",", ""))
    return sum + revenue
  }, 0)

  const activeDiscounts = discountCodes.filter((d) => d.status === "active").length
  const totalUses = discountCodes.reduce((sum, discount) => sum + discount.uses, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discounts</h1>
          <p className="text-muted-foreground">Create and manage discount codes and automatic discounts.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create discount
        </Button>
      </div>

      {/* Discount Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDiscountRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From discount usage</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Discounts</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDiscounts}</div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Discount redemptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$127.50</div>
            <p className="text-xs text-muted-foreground">With discounts applied</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="discount-codes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="discount-codes">Discount codes</TabsTrigger>
          <TabsTrigger value="automatic-discounts">Automatic discounts</TabsTrigger>
        </TabsList>

        <TabsContent value="discount-codes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Discount codes</CardTitle>
              <CardDescription>Codes that customers can enter at checkout</CardDescription>
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search discount codes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDiscounts.map((discount) => (
                    <TableRow key={discount.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{discount.code}</div>
                          <div className="text-sm text-muted-foreground">{discount.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(discount.type)}
                          <span className="capitalize">{discount.type.replace("_", " ")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{discount.value}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(discount.status)} variant="secondary">
                          {discount.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{discount.uses}</div>
                          {discount.limit && <div className="text-sm text-muted-foreground">of {discount.limit}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{discount.revenue}</TableCell>
                      <TableCell>{discount.endDate}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
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

        <TabsContent value="automatic-discounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automatic discounts</CardTitle>
              <CardDescription>Discounts that are automatically applied when conditions are met</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Conditions</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {automaticDiscounts.map((discount) => (
                    <TableRow key={discount.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{discount.name}</div>
                          <div className="text-sm text-muted-foreground">{discount.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(discount.type)}
                          <span className="capitalize">{discount.type.replace("_", " ")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(discount.status)} variant="secondary">
                          {discount.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{discount.uses}</TableCell>
                      <TableCell className="font-medium">{discount.revenue}</TableCell>
                      <TableCell>{discount.conditions}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
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
      </Tabs>
    </div>
  )
}
