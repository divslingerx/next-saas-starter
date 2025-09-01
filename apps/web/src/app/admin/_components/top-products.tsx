import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const topProducts = [
  {
    name: "Wireless Headphones",
    sales: 1234,
    revenue: "$24,680",
    image: "/placeholder.svg?height=40&width=40",
  },
  {
    name: "Smart Watch",
    sales: 987,
    revenue: "$19,740",
    image: "/placeholder.svg?height=40&width=40",
  },
  {
    name: "Laptop Stand",
    sales: 756,
    revenue: "$15,120",
    image: "/placeholder.svg?height=40&width=40",
  },
  {
    name: "USB-C Cable",
    sales: 543,
    revenue: "$10,860",
    image: "/placeholder.svg?height=40&width=40",
  },
]

export function TopProducts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Products</CardTitle>
        <CardDescription>Best performing products this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topProducts.map((product, index) => (
            <div key={product.name} className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={product.image || "/placeholder.svg"} alt={product.name} />
                <AvatarFallback>{product.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{product.name}</p>
                <p className="text-sm text-muted-foreground">{product.sales} sales</p>
              </div>
              <div className="text-sm font-medium">{product.revenue}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
