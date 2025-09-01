import { DashboardStats } from "@/components/dashboard-stats"
import { RecentOrders } from "@/components/recent-orders"
import { SalesChart } from "@/components/sales-chart"
import { TopProducts } from "@/components/top-products"
import { RecentActivities } from "@/components/recent-activities"
import { LeadsPipeline } from "@/components/leads-pipeline"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your SceneKeeper admin dashboard. Here's what's happening with your business today.
        </p>
      </div>

      <DashboardStats />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <SalesChart />
        </div>
        <div className="col-span-3">
          <LeadsPipeline />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RecentOrders />
        <RecentActivities />
      </div>

      <TopProducts />
    </div>
  )
}
