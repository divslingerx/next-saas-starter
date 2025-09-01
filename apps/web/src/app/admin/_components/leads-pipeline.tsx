import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const pipelineStages = [
  {
    name: "New Leads",
    count: 45,
    value: "$125,000",
    color: "bg-blue-500",
  },
  {
    name: "Qualified",
    count: 23,
    value: "$89,500",
    color: "bg-yellow-500",
  },
  {
    name: "Proposal",
    count: 12,
    value: "$67,800",
    color: "bg-orange-500",
  },
  {
    name: "Negotiation",
    count: 8,
    value: "$45,200",
    color: "bg-purple-500",
  },
  {
    name: "Closed Won",
    count: 15,
    value: "$156,700",
    color: "bg-green-500",
  },
]

export function LeadsPipeline() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Pipeline</CardTitle>
        <CardDescription>Current deals by stage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pipelineStages.map((stage, index) => (
            <div key={stage.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                <div>
                  <p className="text-sm font-medium">{stage.name}</p>
                  <p className="text-xs text-muted-foreground">{stage.count} deals</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{stage.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
