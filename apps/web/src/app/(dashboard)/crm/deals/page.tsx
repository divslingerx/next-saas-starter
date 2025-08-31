"use client";

/**
 * Deals Pipeline Page
 * Uses the KanbanBoard component for visual pipeline management
 */

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { Button } from "@charmlabs/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@charmlabs/ui/components/card";
import { KanbanBoard } from "@/components/crm/kanban/KanbanBoard";
import type { Task } from "@/components/crm/kanban/TaskCard";
import type { Column } from "@/components/crm/kanban/BoardColumn";
import { 
  Plus, 
  Filter,
  DollarSign,
  TrendingUp,
  Calendar,
  User
} from "lucide-react";
import { Badge } from "@charmlabs/ui/components/badge";

export default function DealsPage() {
  const [selectedPipeline, setSelectedPipeline] = useState<number>(1);
  
  // Fetch pipelines and deals
  const { data: pipelines } = api.deal.getPipelines.useQuery();
  const { data: deals, refetch } = api.deal.search.useQuery({
    pipelineId: selectedPipeline,
    status: "open",
  });

  // Transform pipeline stages to kanban columns
  const columns: Column[] = pipelines?.find(p => p.id === selectedPipeline)?.stages.map(stage => ({
    id: stage.id.toString(),
    title: stage.name,
  })) || [];

  // Transform deals to kanban tasks
  const tasks: Task[] = deals?.data.map(deal => ({
    id: deal.id.toString(),
    columnId: deal.stageId.toString(),
    content: (
      <div className="space-y-2">
        <div className="font-medium">{deal.title}</div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DollarSign className="h-3 w-3" />
          ${deal.value.toLocaleString()}
        </div>
        {deal.expectedCloseDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(deal.expectedCloseDate).toLocaleDateString()}
          </div>
        )}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {deal.probability}% likely
          </Badge>
          {deal.ownerId && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
            </div>
          )}
        </div>
      </div>
    ),
  })) || [];

  const handleDealMove = async (dealId: string, newStageId: string) => {
    // Update deal stage via API
    await api.deal.moveStage.mutate({
      dealId: parseInt(dealId),
      stageId: parseInt(newStageId),
    });
    refetch();
  };

  // Calculate pipeline metrics
  const totalValue = deals?.data.reduce((sum, deal) => sum + deal.value, 0) || 0;
  const dealCount = deals?.data.length || 0;
  const avgDealSize = dealCount > 0 ? totalValue / dealCount : 0;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sales Pipeline</h2>
          <p className="text-muted-foreground">
            Track and manage your deals through the sales process
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Pipeline Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{dealCount} deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Deal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgDealSize.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per opportunity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weighted Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${deals?.data.reduce((sum, deal) => 
                sum + (deal.value * (deal.probability / 100)), 0
              ).toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Based on probability</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closing Soon</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deals?.data.filter(d => {
                if (!d.expectedCloseDate) return false;
                const daysUntil = Math.floor(
                  (new Date(d.expectedCloseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                return daysUntil <= 30 && daysUntil >= 0;
              }).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Selector */}
      {pipelines && pipelines.length > 1 && (
        <div className="flex gap-2">
          {pipelines.map(pipeline => (
            <Button
              key={pipeline.id}
              variant={pipeline.id === selectedPipeline ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPipeline(pipeline.id)}
            >
              {pipeline.name}
            </Button>
          ))}
        </div>
      )}

      {/* Kanban Board */}
      <Card>
        <CardContent className="p-6">
          <KanbanBoard
            columns={columns}
            initialTasks={tasks}
            onTaskMove={handleDealMove}
          />
        </CardContent>
      </Card>
    </div>
  );
}