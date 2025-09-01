"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  ArrowUpIcon,
  ArrowDownIcon,
  Wallet,
  Receipt,
} from "lucide-react"

const paymentMethods = [
  {
    name: "Credit Cards",
    provider: "Stripe",
    status: "active",
    transactions: 1234,
    volume: "$45,231.89",
    fees: "$1,356.96",
  },
  {
    name: "PayPal",
    provider: "PayPal",
    status: "active",
    transactions: 456,
    volume: "$12,456.78",
    fees: "$373.70",
  },
  {
    name: "Apple Pay",
    provider: "Stripe",
    status: "active",
    transactions: 234,
    volume: "$8,765.43",
    fees: "$262.96",
  },
  {
    name: "Shop Pay",
    provider: "Shopify",
    status: "active",
    transactions: 123,
    volume: "$4,321.09",
    fees: "$129.63",
  },
]

const transactions = [
  {
    id: "TXN-001",
    type: "sale",
    amount: "$142.50",
    fee: "$4.28",
    net: "$138.22",
    method: "Visa ****1234",
    status: "completed",
    date: "2024-01-15 14:30",
    order: "#1001",
  },
  {
    id: "TXN-002",
    type: "refund",
    amount: "-$89.99",
    fee: "-$2.70",
    net: "-$87.29",
    method: "PayPal",
    status: "completed",
    date: "2024-01-15 12:15",
    order: "#1002",
  },
  {
    id: "TXN-003",
    type: "sale",
    amount: "$256.00",
    fee: "$7.68",
    net: "$248.32",
    method: "Apple Pay",
    status: "completed",
    date: "2024-01-14 16:45",
    order: "#1003",
  },
  {
    id: "TXN-004",
    type: "chargeback",
    amount: "-$78.25",
    fee: "$15.00",
    net: "-$93.25",
    method: "Mastercard ****5678",
    status: "disputed",
    date: "2024-01-14 09:20",
    order: "#1004",
  },
  {
    id: "TXN-005",
    type: "sale",
    amount: "$195.50",
    fee: "$5.87",
    net: "$189.63",
    method: "Shop Pay",
    status: "pending",
    date: "2024-01-13 18:30",
    order: "#1005",
  },
]

const payouts = [
  {
    id: "PO-001",
    amount: "$4,567.89",
    status: "paid",
    date: "2024-01-15",
    method: "Bank Transfer",
    transactions: 45,
  },
  {
    id: "PO-002",
    amount: "$3,234.56",
    status: "pending",
    date: "2024-01-08",
    method: "Bank Transfer",
    transactions: 32,
  },
  {
    id: "PO-003",
    amount: "$5,678.90",
    status: "paid",
    date: "2024-01-01",
    method: "Bank Transfer",
    transactions: 56,
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
    case "paid":
    case "active":
      return "bg-green-100 text-green-800"
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "disputed":
    case "failed":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case "sale":
      return <ArrowUpIcon className="w-4 h-4 text-green-500" />
    case "refund":
    case "chargeback":
      return <ArrowDownIcon className="w-4 h-4 text-red-500" />
    default:
      return <DollarSign className="w-4 h-4" />
  }
}

export default function Finances() {
  const totalRevenue = 66775.19
  const totalFees = 2123.25
  const netRevenue = totalRevenue - totalFees
  const pendingPayouts = 3234.56

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finances</h1>
          <p className="text-muted-foreground">Track your revenue, payments, and financial performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Date range
          </Button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+12.5%</span>
              from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${netRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+10.2%</span>
              from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-500" />
              <span className="text-red-500">+15.3%</span>
              from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingPayouts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Next payout in 2 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>All payment transactions from your store</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.type)}
                          <span className="capitalize">{transaction.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{transaction.amount}</TableCell>
                      <TableCell>{transaction.fee}</TableCell>
                      <TableCell className="font-medium">{transaction.net}</TableCell>
                      <TableCell>{transaction.method}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status)} variant="secondary">
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payouts</CardTitle>
              <CardDescription>Money transferred to your bank account</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payout ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Transactions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-medium">{payout.id}</TableCell>
                      <TableCell className="font-medium">{payout.amount}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payout.status)} variant="secondary">
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{payout.date}</TableCell>
                      <TableCell>{payout.method}</TableCell>
                      <TableCell>{payout.transactions} transactions</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Payment options available to your customers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Fees</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods.map((method, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{method.name}</TableCell>
                      <TableCell>{method.provider}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(method.status)} variant="secondary">
                          {method.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{method.transactions}</TableCell>
                      <TableCell className="font-medium">{method.volume}</TableCell>
                      <TableCell>{method.fees}</TableCell>
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
