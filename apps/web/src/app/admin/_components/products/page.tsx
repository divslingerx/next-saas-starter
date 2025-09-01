"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy,
  Package,
  TrendingUp,
  AlertTriangle,
  Filter,
  Download,
  Upload,
  Archive,
  Star,
  BarChart3,
} from "lucide-react"
import Image from "next/image"

const products = [
  {
    id: 1,
    name: "Wireless Headphones",
    sku: "WH-001",
    status: "active",
    inventory: 45,
    committed: 5,
    available: 40,
    price: "$199.99",
    comparePrice: "$249.99",
    cost: "$120.00",
    profit: "$79.99",
    margin: "40%",
    image: "/placeholder.svg?height=60&width=60",
    category: "Electronics",
    vendor: "TechCorp",
    type: "Headphones",
    tags: ["wireless", "bluetooth", "premium"],
    variants: 3,
    sales: 234,
    revenue: "$46,797.66",
    rating: 4.8,
    reviews: 156,
  },
  {
    id: 2,
    name: "Smart Watch",
    sku: "SW-002",
    status: "active",
    inventory: 23,
    committed: 2,
    available: 21,
    price: "$299.99",
    comparePrice: "$349.99",
    cost: "$180.00",
    profit: "$119.99",
    margin: "40%",
    image: "/placeholder.svg?height=60&width=60",
    category: "Electronics",
    vendor: "WearTech",
    type: "Wearables",
    tags: ["smart", "fitness", "health"],
    variants: 2,
    sales: 189,
    revenue: "$56,697.11",
    rating: 4.6,
    reviews: 89,
  },
  {
    id: 3,
    name: "Laptop Stand",
    sku: "LS-003",
    status: "draft",
    inventory: 67,
    committed: 0,
    available: 67,
    price: "$49.99",
    comparePrice: "$59.99",
    cost: "$25.00",
    profit: "$24.99",
    margin: "50%",
    image: "/placeholder.svg?height=60&width=60",
    category: "Accessories",
    vendor: "DeskPro",
    type: "Stands",
    tags: ["ergonomic", "adjustable", "aluminum"],
    variants: 1,
    sales: 0,
    revenue: "$0.00",
    rating: 0,
    reviews: 0,
  },
  {
    id: 4,
    name: "USB-C Cable",
    sku: "UC-004",
    status: "active",
    inventory: 0,
    committed: 0,
    available: 0,
    price: "$19.99",
    comparePrice: "$24.99",
    cost: "$8.00",
    profit: "$11.99",
    margin: "60%",
    image: "/placeholder.svg?height=60&width=60",
    category: "Accessories",
    vendor: "CableCo",
    type: "Cables",
    tags: ["usb-c", "fast-charging", "durable"],
    variants: 2,
    sales: 456,
    revenue: "$9,115.44",
    rating: 4.9,
    reviews: 234,
  },
  {
    id: 5,
    name: "Bluetooth Speaker",
    sku: "BS-005",
    status: "active",
    inventory: 12,
    committed: 3,
    available: 9,
    price: "$89.99",
    comparePrice: "$109.99",
    cost: "$45.00",
    profit: "$44.99",
    margin: "50%",
    image: "/placeholder.svg?height=60&width=60",
    category: "Electronics",
    vendor: "SoundWave",
    type: "Speakers",
    tags: ["bluetooth", "portable", "waterproof"],
    variants: 4,
    sales: 123,
    revenue: "$11,068.77",
    rating: 4.7,
    reviews: 67,
  },
]

const collections = [
  { name: "Featured Products", count: 12 },
  { name: "Electronics", count: 45 },
  { name: "Accessories", count: 23 },
  { name: "Best Sellers", count: 8 },
  { name: "New Arrivals", count: 15 },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800"
    case "draft":
      return "bg-gray-100 text-gray-800"
    case "archived":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getInventoryStatus = (inventory: number, committed: number) => {
  const available = inventory - committed
  if (available === 0) return { text: "Out of stock", color: "bg-red-100 text-red-800", icon: AlertTriangle }
  if (available < 10) return { text: "Low stock", color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle }
  return { text: "In stock", color: "bg-green-100 text-green-800", icon: Package }
}

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [selectedProduct, setSelectedProduct] = useState<(typeof products)[0] | null>(null)

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const toggleProductSelection = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const toggleAllProducts = () => {
    setSelectedProducts(
      selectedProducts.length === filteredProducts.length ? [] : filteredProducts.map((product) => product.id),
    )
  }

  const totalProducts = products.length
  const activeProducts = products.filter((p) => p.status === "active").length
  const lowStockProducts = products.filter(
    (p) => p.inventory - p.committed < 10 && p.inventory - p.committed > 0,
  ).length
  const outOfStockProducts = products.filter((p) => p.inventory - p.committed === 0).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory, pricing, and collections.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add product
          </Button>
        </div>
      </div>

      {/* Product Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">All products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProducts}</div>
            <p className="text-xs text-muted-foreground">Published products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockProducts}</div>
            <p className="text-xs text-muted-foreground">Unavailable</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All products</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products..."
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
                <CardTitle>All Products</CardTitle>
                {selectedProducts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{selectedProducts.length} selected</span>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Bulk edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
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
                        checked={selectedProducts.length === filteredProducts.length}
                        onCheckedChange={toggleAllProducts}
                      />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Inventory</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const inventoryStatus = getInventoryStatus(product.inventory, product.committed)
                    const StatusIcon = inventoryStatus.icon
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Image
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              width={60}
                              height={60}
                              className="rounded-md"
                            />
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                              <div className="flex gap-1 mt-1">
                                {product.tags.slice(0, 2).map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {product.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{product.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(product.status)} variant="secondary">
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <StatusIcon className="w-4 h-4" />
                              <span>{product.available} available</span>
                            </div>
                            <Badge className={inventoryStatus.color} variant="secondary">
                              {inventoryStatus.text}
                            </Badge>
                            {product.committed > 0 && (
                              <div className="text-xs text-muted-foreground">{product.committed} committed</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.sales} sold</div>
                            <div className="text-sm text-muted-foreground">{product.revenue}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.price}</div>
                            {product.comparePrice && (
                              <div className="text-sm text-muted-foreground line-through">{product.comparePrice}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-green-600">{product.profit}</div>
                            <div className="text-sm text-muted-foreground">{product.margin} margin</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.rating > 0 ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{product.rating}</span>
                              <span className="text-sm text-muted-foreground">({product.reviews})</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No reviews</span>
                          )}
                        </TableCell>
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
                                  <DropdownMenuItem onSelect={() => setSelectedProduct(product)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View details
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Duplicate
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

                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Product Details - {selectedProduct?.name}</DialogTitle>
                                <DialogDescription>
                                  Complete product information and management options
                                </DialogDescription>
                              </DialogHeader>

                              {selectedProduct && (
                                <div className="space-y-6">
                                  {/* Product Image and Basic Info */}
                                  <div className="flex gap-6">
                                    <Image
                                      src={selectedProduct.image || "/placeholder.svg"}
                                      alt={selectedProduct.name}
                                      width={120}
                                      height={120}
                                      className="rounded-lg"
                                    />
                                    <div className="flex-1 space-y-2">
                                      <h3 className="text-xl font-semibold">{selectedProduct.name}</h3>
                                      <p className="text-muted-foreground">SKU: {selectedProduct.sku}</p>
                                      <div className="flex items-center gap-2">
                                        <Badge className={getStatusColor(selectedProduct.status)} variant="secondary">
                                          {selectedProduct.status}
                                        </Badge>
                                        <Badge variant="outline">{selectedProduct.category}</Badge>
                                        <Badge variant="outline">{selectedProduct.type}</Badge>
                                      </div>
                                      {selectedProduct.rating > 0 && (
                                        <div className="flex items-center gap-1">
                                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                          <span className="font-medium">{selectedProduct.rating}</span>
                                          <span className="text-sm text-muted-foreground">
                                            ({selectedProduct.reviews} reviews)
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Pricing and Inventory */}
                                  <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                      <h4 className="font-medium">Pricing</h4>
                                      <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <span>Price:</span>
                                          <span className="font-medium">{selectedProduct.price}</span>
                                        </div>
                                        {selectedProduct.comparePrice && (
                                          <div className="flex justify-between">
                                            <span>Compare at:</span>
                                            <span className="line-through text-muted-foreground">
                                              {selectedProduct.comparePrice}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex justify-between">
                                          <span>Cost:</span>
                                          <span>{selectedProduct.cost}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Profit:</span>
                                          <span className="font-medium text-green-600">{selectedProduct.profit}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Margin:</span>
                                          <span>{selectedProduct.margin}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="space-y-4">
                                      <h4 className="font-medium">Inventory</h4>
                                      <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <span>Total inventory:</span>
                                          <span className="font-medium">{selectedProduct.inventory}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Committed:</span>
                                          <span>{selectedProduct.committed}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Available:</span>
                                          <span className="font-medium">{selectedProduct.available}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Variants:</span>
                                          <span>{selectedProduct.variants}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Sales Performance */}
                                  <div>
                                    <h4 className="font-medium mb-3">Sales Performance</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                      <div className="text-center p-3 border rounded">
                                        <div className="text-2xl font-bold">{selectedProduct.sales}</div>
                                        <div className="text-sm text-muted-foreground">Units Sold</div>
                                      </div>
                                      <div className="text-center p-3 border rounded">
                                        <div className="text-2xl font-bold">{selectedProduct.revenue}</div>
                                        <div className="text-sm text-muted-foreground">Revenue</div>
                                      </div>
                                      <div className="text-center p-3 border rounded">
                                        <div className="text-2xl font-bold">{selectedProduct.variants}</div>
                                        <div className="text-sm text-muted-foreground">Variants</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Product Tags */}
                                  <div>
                                    <h4 className="font-medium mb-3">Tags</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedProduct.tags.map((tag, index) => (
                                        <Badge key={index} variant="outline">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Vendor Information */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Vendor</Label>
                                      <p className="text-sm text-muted-foreground mt-1">{selectedProduct.vendor}</p>
                                    </div>
                                    <div>
                                      <Label>Product Type</Label>
                                      <p className="text-sm text-muted-foreground mt-1">{selectedProduct.type}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Collections</CardTitle>
              <CardDescription>Organize your products into collections for better management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {collections.map((collection, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{collection.name}</CardTitle>
                      <CardDescription>{collection.count} products</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
