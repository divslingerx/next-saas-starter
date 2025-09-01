"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Edit, Trash2, Truck, Package, Clock, MapPin, Settings, Zap, Globe } from "lucide-react"

const shippingZones = [
  {
    id: 1,
    name: "United States",
    countries: ["United States"],
    regions: 50,
    rates: [
      { name: "Standard Shipping", price: "$5.99", time: "5-7 business days", conditions: "Orders under $50" },
      { name: "Express Shipping", price: "$12.99", time: "2-3 business days", conditions: "All orders" },
      { name: "Free Shipping", price: "Free", time: "5-7 business days", conditions: "Orders over $50" },
    ],
  },
  {
    id: 2,
    name: "Canada",
    countries: ["Canada"],
    regions: 13,
    rates: [
      { name: "Standard Shipping", price: "$8.99", time: "7-10 business days", conditions: "All orders" },
      { name: "Express Shipping", price: "$19.99", time: "3-5 business days", conditions: "All orders" },
    ],
  },
  {
    id: 3,
    name: "Europe",
    countries: ["United Kingdom", "Germany", "France", "Italy", "Spain"],
    regions: 27,
    rates: [
      { name: "Standard International", price: "$15.99", time: "10-15 business days", conditions: "All orders" },
      { name: "Express International", price: "$29.99", time: "5-7 business days", conditions: "All orders" },
    ],
  },
  {
    id: 4,
    name: "Rest of World",
    countries: ["All other countries"],
    regions: 195,
    rates: [{ name: "International Shipping", price: "$25.99", time: "15-30 business days", conditions: "All orders" }],
  },
]

const carriers = [
  {
    name: "USPS",
    status: "connected",
    services: ["Priority Mail", "Ground Advantage", "Priority Mail Express"],
    logo: "🇺🇸",
    rates: "Live rates",
  },
  {
    name: "UPS",
    status: "connected",
    services: ["UPS Ground", "UPS 2nd Day Air", "UPS Next Day Air"],
    logo: "📦",
    rates: "Live rates",
  },
  {
    name: "FedEx",
    status: "available",
    services: ["FedEx Ground", "FedEx 2Day", "FedEx Overnight"],
    logo: "✈️",
    rates: "Not connected",
  },
  {
    name: "DHL",
    status: "available",
    services: ["DHL Express", "DHL Ground"],
    logo: "🚚",
    rates: "Not connected",
  },
]

const fulfillmentOrders = [
  {
    id: "#1001",
    customer: "John Doe",
    items: 2,
    destination: "New York, NY",
    status: "fulfilled",
    method: "USPS Priority Mail",
    tracking: "9405511206213414161234",
    date: "2024-01-15",
    cost: "$5.99",
  },
  {
    id: "#1002",
    customer: "Jane Smith",
    items: 1,
    destination: "Los Angeles, CA",
    status: "pending",
    method: "UPS Ground",
    tracking: null,
    date: "2024-01-15",
    cost: "$8.99",
  },
  {
    id: "#1003",
    customer: "Bob Johnson",
    items: 3,
    destination: "Chicago, IL",
    status: "shipped",
    method: "FedEx 2Day",
    tracking: "1234567890123456",
    date: "2024-01-14",
    cost: "$12.99",
  },
  {
    id: "#1004",
    customer: "Alice Brown",
    items: 1,
    destination: "Houston, TX",
    status: "delivered",
    method: "USPS Ground Advantage",
    tracking: "9405511206213414161235",
    date: "2024-01-14",
    cost: "$5.99",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "connected":
    case "fulfilled":
    case "delivered":
      return "bg-green-100 text-green-800"
    case "pending":
    case "available":
      return "bg-yellow-100 text-yellow-800"
    case "shipped":
      return "bg-blue-100 text-blue-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "fulfilled":
    case "delivered":
      return <Package className="w-4 h-4" />
    case "shipped":
      return <Truck className="w-4 h-4" />
    case "pending":
      return <Clock className="w-4 h-4" />
    default:
      return <Package className="w-4 h-4" />
  }
}

export default function Shipping() {
  const [zones, setZones] = useState(shippingZones)

  const totalZones = zones.length
  const totalRates = zones.reduce((sum, zone) => sum + zone.rates.length, 0)
  const connectedCarriers = carriers.filter((c) => c.status === "connected").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipping and delivery</h1>
          <p className="text-muted-foreground">Manage shipping zones, rates, and fulfillment settings.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create shipping zone
        </Button>
      </div>

      {/* Shipping Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipping Zones</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalZones}</div>
            <p className="text-xs text-muted-foreground">Active zones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipping Rates</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRates}</div>
            <p className="text-xs text-muted-foreground">Configured rates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Carriers</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedCarriers}</div>
            <p className="text-xs text-muted-foreground">Live rate providers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Shipping Cost</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$8.99</div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="zones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="zones">Shipping zones</TabsTrigger>
          <TabsTrigger value="carriers">Carriers</TabsTrigger>
          <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="space-y-4">
          <div className="space-y-4">
            {zones.map((zone) => (
              <Card key={zone.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        {zone.name}
                      </CardTitle>
                      <CardDescription>
                        {zone.countries.join(", ")} • {zone.regions} regions
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit zone
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Plus className="w-4 h-4 mr-2" />
                          Add rate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete zone
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium">Shipping rates</h4>
                    {zone.rates.map((rate, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{rate.name}</div>
                          <div className="text-sm text-muted-foreground">{rate.conditions}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{rate.price}</div>
                          <div className="text-sm text-muted-foreground">{rate.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="carriers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipping carriers</CardTitle>
              <CardDescription>Connect with shipping carriers to get live rates and print labels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {carriers.map((carrier, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{carrier.logo}</div>
                      <div className="space-y-1">
                        <div className="font-medium">{carrier.name}</div>
                        <div className="text-sm text-muted-foreground">{carrier.services.join(", ")}</div>
                        <div className="text-sm">{carrier.rates}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(carrier.status)} variant="secondary">
                        {carrier.status}
                      </Badge>
                      {carrier.status === "connected" ? (
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
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

        <TabsContent value="fulfillment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent fulfillments</CardTitle>
              <CardDescription>Track and manage order fulfillment and shipping</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fulfillmentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.items} items</TableCell>
                      <TableCell>{order.destination}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <Badge className={getStatusColor(order.status)} variant="secondary">
                            {order.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{order.method}</TableCell>
                      <TableCell>
                        {order.tracking ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">{order.tracking}</code>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{order.cost}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Truck className="w-4 h-4 mr-2" />
                              Track package
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Package className="w-4 h-4 mr-2" />
                              Print label
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
