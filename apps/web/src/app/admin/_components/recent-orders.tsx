import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const recentOrders = [
  {
    id: "#1001",
    customer: "John Doe",
    email: "john@example.com",
    status: "fulfilled",
    total: "$142.50",
    date: "2024-01-15",
  },
  {
    id: "#1002",
    customer: "Jane Smith",
    email: "jane@example.com",
    status: "pending",
    total: "$89.99",
    date: "2024-01-15",
  },
  {
    id: "#1003",
    customer: "Bob Johnson",
    email: "bob@example.com",
    status: "shipped",
    total: "$256.00",
    date: "2024-01-14",
  },
  {
    id: "#1004",
    customer: "Alice Brown",
    email: "alice@example.com",
    status: "fulfilled",
    total: "$78.25",
    date: "2024-01-14",
  },
  {
    id: "#1005",
    customer: "Charlie Wilson",
    email: "charlie@example.com",
    status: "cancelled",
    total: "$195.50",
    date: "2024-01-13",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "fulfilled":
      return "bg-green-100 text-green-800"
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "shipped":
      return "bg-blue-100 text-blue-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function RecentOrders() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest orders from your store</CardDescription>
        </div>
        <Button variant="outline">View all</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.customer}</div>
                    <div className="text-sm text-muted-foreground">{order.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(order.status)} variant="secondary">
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>{order.date}</TableCell>
                <TableCell className="text-right">{order.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
