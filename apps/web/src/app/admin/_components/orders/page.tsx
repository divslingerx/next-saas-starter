"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  MoreHorizontal,
  Eye,
  Truck,
  X,
  Filter,
  Download,
  Package,
  CreditCard,
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Archive,
} from "lucide-react"

const orders = [
  {
    id: "#1001",
    customer: {
      name: "John Doe",
      email: "john@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    status: "fulfilled",
    paymentStatus: "paid",
    fulfillmentStatus: "fulfilled",
    total: "$142.50",
    date: "2024-01-15",
    items: [
      { name: "Wireless Headphones", quantity: 1, price: "$99.99" },
      { name: "USB-C Cable", quantity: 2, price: "$19.99" },
    ],
    shippingAddress: "123 Main St, New York, NY 10001",
    trackingNumber: "1Z999AA1234567890",
    tags: ["VIP", "Repeat Customer"],
  },
  {
    id: "#1002",
    customer: {
      name: "Jane Smith",
      email: "jane@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    status: "pending",
    paymentStatus: "pending",
    fulfillmentStatus: "unfulfilled",
    total: "$89.99",
    date: "2024-01-15",
    items: [{ name: "Smart Watch", quantity: 1, price: "$89.99" }],
    shippingAddress: "456 Oak Ave, Los Angeles, CA 90210",
    trackingNumber: null,
    tags: ["New Customer"],
  },
  {
    id: "#1003",
    customer: {
      name: "Bob Johnson",
      email: "bob@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    status: "shipped",
    paymentStatus: "paid",
    fulfillmentStatus: "partial",
    total: "$256.00",
    date: "2024-01-14",
    items: [
      { name: "Laptop Stand", quantity: 1, price: "$49.99" },
      { name: "Bluetooth Speaker", quantity: 2, price: "$89.99" },
    ],
    shippingAddress: "789 Pine St, Chicago, IL 60601",
    trackingNumber: "1Z999AA1234567891",
    tags: ["Bulk Order"],
  },
  {
    id: "#1004",
    customer: {
      name: "Alice Brown",
      email: "alice@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    status: "fulfilled",
    paymentStatus: "paid",
    fulfillmentStatus: "fulfilled",
    total: "$78.25",
    date: "2024-01-14",
    items: [
      { name: "Phone Case", quantity: 1, price: "$24.99" },
      { name: "Screen Protector", quantity: 3, price: "$15.99" },
    ],
    shippingAddress: "321 Elm St, Houston, TX 77001",
    trackingNumber: "1Z999AA1234567892",
    tags: ["Mobile Accessories"],
  },
  {
    id: "#1005",
    customer: {
      name: "Charlie Wilson",
      email: "charlie@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    status: "cancelled",
    paymentStatus: "refunded",
    fulfillmentStatus: "cancelled",
    total: "$195.50",
    date: "2024-01-13",
    items: [
      { name: "Gaming Mouse", quantity: 1, price: "$79.99" },
      { name: "Mechanical Keyboard", quantity: 1, price: "$115.51" },
    ],
    shippingAddress: "654 Maple Dr, Phoenix, AZ 85001",
    trackingNumber: null,
    tags: ["Gaming", "Cancelled"],
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "fulfilled":
    case "paid":
      return "bg-green-100 text-green-800"
    case "pending":
    case "unfulfilled":
      return "bg-yellow-100 text-yellow-800"
    case "shipped":
    case "partial":
      return "bg-blue-100 text-blue-800"
    case "cancelled":
    case "refunded":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "fulfilled":
    case "paid":
      return <CheckCircle className="w-4 h-4" />
    case "pending":
    case "unfulfilled":
      return <Clock className="w-4 h-4" />
    case "shipped":
    case "partial":
      return <Truck className="w-4 h-4" />
    case "cancelled":
    case "refunded":
      return <X className="w-4 h-4" />
    default:
      return <AlertCircle className="w-4 h-4" />
  }
}

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [selectedOrder, setSelectedOrder] = useState<(typeof orders)[0] | null>(null)

  const filteredOrders = orders.filter(
    (order) =>
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]))
  }

  const toggleAllOrders = () => {
    setSelectedOrders(selectedOrders.length === filteredOrders.length ? [] : filteredOrders.map((order) => order.id))
  }

  const totalOrders = orders.length
  const fulfilledOrders = orders.filter((o) => o.status === "fulfilled").length
  const pendingOrders = orders.filter((o) => o.status === "pending").length
  const totalRevenue = orders.reduce((sum, order) => {
    const amount = Number.parseFloat(order.total.replace("$", "").replace(",", ""))
    return sum + amount
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage and track all your customer orders.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync
          </Button>
        </div>
      </div>

      {/* Order Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fulfilled</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fulfilledOrders}</div>
            <p className="text-xs text-muted-foreground">Completed orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting fulfillment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total order value</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All orders</TabsTrigger>
            <TabsTrigger value="unfulfilled">Unfulfilled</TabsTrigger>
            <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Orders</CardTitle>
                {selectedOrders.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{selectedOrders.length} selected</span>
                    <Button variant="outline" size="sm">
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </Button>
                    <Button variant="outline" size="sm">
                      <Package className="w-4 h-4 mr-2" />
                      Fulfill
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedOrders.length === filteredOrders.length}
                        onCheckedChange={toggleAllOrders}
                      />
                    </TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Fulfillment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => toggleOrderSelection(order.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={order.customer.avatar || "/placeholder.svg"} alt={order.customer.name} />
                            <AvatarFallback>
                              {order.customer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{order.customer.name}</div>
                            <div className="text-sm text-muted-foreground">{order.customer.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <Badge className={getStatusColor(order.status)} variant="secondary">
                            {order.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.paymentStatus)} variant="secondary">
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.fulfillmentStatus)} variant="secondary">
                          {order.fulfillmentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.date}</TableCell>
                      <TableCell className="text-right font-medium">{order.total}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={() => setSelectedOrder(order)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View details
                                </DropdownMenuItem>
                              </DialogTrigger>
                              <DropdownMenuItem>
                                <Package className="w-4 h-4 mr-2" />
                                Fulfill order
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Truck className="w-4 h-4 mr-2" />
                                Track shipment
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <X className="w-4 h-4 mr-2" />
                                Cancel order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Order Details - {selectedOrder?.id}</DialogTitle>
                              <DialogDescription>Complete order information and management options</DialogDescription>
                            </DialogHeader>

                            {selectedOrder && (
                              <div className="space-y-6">
                                {/* Customer Info */}
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage
                                      src={selectedOrder.customer.avatar || "/placeholder.svg"}
                                      alt={selectedOrder.customer.name}
                                    />
                                    <AvatarFallback>
                                      {selectedOrder.customer.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-medium">{selectedOrder.customer.name}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedOrder.customer.email}</p>
                                  </div>
                                </div>

                                <Separator />

                                {/* Order Status */}
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Order Status</label>
                                    <div className="flex items-center gap-2 mt-1">
                                      {getStatusIcon(selectedOrder.status)}
                                      <Badge className={getStatusColor(selectedOrder.status)} variant="secondary">
                                        {selectedOrder.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Payment Status</label>
                                    <div className="mt-1">
                                      <Badge
                                        className={getStatusColor(selectedOrder.paymentStatus)}
                                        variant="secondary"
                                      >
                                        {selectedOrder.paymentStatus}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Fulfillment Status</label>
                                    <div className="mt-1">
                                      <Badge
                                        className={getStatusColor(selectedOrder.fulfillmentStatus)}
                                        variant="secondary"
                                      >
                                        {selectedOrder.fulfillmentStatus}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                <Separator />

                                {/* Order Items */}
                                <div>
                                  <h4 className="font-medium mb-3">Order Items</h4>
                                  <div className="space-y-2">
                                    {selectedOrder.items.map((item, index) => (
                                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                                        <div>
                                          <div className="font-medium">{item.name}</div>
                                          <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                                        </div>
                                        <div className="font-medium">{item.price}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <Separator />

                                {/* Shipping & Tracking */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium flex items-center gap-2">
                                      <MapPin className="w-4 h-4" />
                                      Shipping Address
                                    </label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {selectedOrder.shippingAddress}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium flex items-center gap-2">
                                      <Truck className="w-4 h-4" />
                                      Tracking Number
                                    </label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {selectedOrder.trackingNumber || "Not available"}
                                    </p>
                                  </div>
                                </div>

                                <Separator />

                                {/* Order Tags */}
                                <div>
                                  <label className="text-sm font-medium">Tags</label>
                                  <div className="flex gap-2 mt-1">
                                    {selectedOrder.tags.map((tag, index) => (
                                      <Badge key={index} variant="outline">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                {/* Order Total */}
                                <div className="text-right">
                                  <div className="text-2xl font-bold">{selectedOrder.total}</div>
                                  <div className="text-sm text-muted-foreground">Order Total</div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
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
