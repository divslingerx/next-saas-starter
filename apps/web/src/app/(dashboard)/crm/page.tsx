/**
 * CRM Dashboard Page
 * Main entry point for CRM functionality
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { api } from "@/trpc/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@charmlabs/ui/components/card";
import { Button } from "@charmlabs/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@charmlabs/ui/components/tabs";
import { 
  Users, 
  Building2, 
  DollarSign, 
  TrendingUp,
  Plus,
  Upload,
  Settings
} from "lucide-react";

async function CRMMetrics() {
  // Get metrics from our platform service
  const metrics = await api.deal.getMetrics();
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,234</div>
          <p className="text-xs text-muted-foreground">+12% from last month</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.dealsByStatus.open}</div>
          <p className="text-xs text-muted-foreground">
            ${metrics.totalValue.toLocaleString()} total value
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.winRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {metrics.dealsByStatus.won} won, {metrics.dealsByStatus.lost} lost
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${metrics.averageDealSize.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.averageSalesCycle.toFixed(0)} day avg cycle
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function CRMDashboard() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">CRM Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your contacts, deals, and customer relationships
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Contact
          </Button>
        </div>
      </div>

      <Suspense fallback={<div>Loading metrics...</div>}>
        <CRMMetrics />
      </Suspense>

      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>
        
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Contacts</CardTitle>
              <CardDescription>
                Your most recently added or updated contacts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* ContactsTable component would go here */}
              <p className="text-muted-foreground">Contact table coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Companies</CardTitle>
              <CardDescription>
                Organizations you're working with
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Company table coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="deals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Deals</CardTitle>
              <CardDescription>
                Track your sales pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* KanbanBoard component would go here for deals */}
              <p className="text-muted-foreground">Deal pipeline coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Activity timeline across all records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Activity feed coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}