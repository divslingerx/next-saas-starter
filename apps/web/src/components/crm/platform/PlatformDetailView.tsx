"use client";

import { useState, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit,
  MoreHorizontal,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Activity,
  FileText,
  User,
  Building2,
  Handshake,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";

export interface PlatformRecord {
  id: number | string;
  properties: Record<string, any>;
  associations?: Record<string, any>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  archived?: boolean;
}

export interface DetailField {
  key: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "phone"
    | "url"
    | "date"
    | "number"
    | "badge"
    | "avatar"
    | "custom";
  icon?: React.ComponentType<{ className?: string }>;
  render?: (value: any, record: PlatformRecord) => ReactNode;
  section?: "header" | "overview" | "contact" | "metrics";
}

export interface DetailTab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
  content: ReactNode;
}

export interface PlatformDetailViewProps {
  record: PlatformRecord;
  objectType: string;
  loading?: boolean;

  // Fields configuration
  headerFields: DetailField[];
  overviewFields: DetailField[];
  metricFields?: DetailField[];

  // Tabs
  customTabs?: DetailTab[];

  // Actions
  onEdit?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;

  // Navigation
  editPath?: string;
  listPath?: string;

  // Avatar/Logo
  avatarField?: string;
  avatarFallbackIcon?: React.ComponentType<{ className?: string }>;
}

function formatFieldValue(
  value: any,
  type: DetailField["type"],
  record: PlatformRecord,
  render?: (value: any, record: PlatformRecord) => ReactNode
): ReactNode {
  if (render) {
    return render(value, record);
  }

  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }

  switch (type) {
    case "email":
      return (
        <a href={`mailto:${value}`} className="text-primary hover:underline">
          {value}
        </a>
      );
    case "phone":
      return (
        <a href={`tel:${value}`} className="text-primary hover:underline">
          {value}
        </a>
      );
    case "url":
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {value}
        </a>
      );
    case "date":
      const date = new Date(value);
      return (
        <span title={date.toLocaleString()}>
          {formatDistanceToNow(date, { addSuffix: true })}
        </span>
      );
    case "number":
      return typeof value === "number" ? value.toLocaleString() : value;
    case "badge":
      return (
        <Badge
          variant={
            value === "active" || value === "Active" ? "default" : "secondary"
          }
        >
          {value}
        </Badge>
      );
    case "avatar":
      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src={value} />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      );
    default:
      return String(value);
  }
}

export function PlatformDetailView({
  record,
  objectType,
  loading = false,
  headerFields,
  overviewFields,
  metricFields = [],
  customTabs = [],
  onEdit,
  onArchive,
  onDelete,
  editPath,
  listPath,
  avatarField,
  avatarFallbackIcon: AvatarFallbackIcon = Building2,
}: PlatformDetailViewProps) {
  const [activeTab, setActiveTab] = useState(
    customTabs.length > 0 ? customTabs[0].id : "overview"
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse">
              <div className="h-16 bg-muted rounded mb-4"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      {editPath ? (
        <Link href={editPath}>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Edit className="h-4 w-4" />
            Edit {objectType}
          </Button>
        </Link>
      ) : onEdit ? (
        <Button
          variant="outline"
          className="gap-2 bg-transparent"
          onClick={onEdit}
        >
          <Edit className="h-4 w-4" />
          Edit {objectType}
        </Button>
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          {onArchive && (
            <DropdownMenuItem onClick={onArchive}>
              Archive {objectType}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem>Export Data</DropdownMenuItem>
          <DropdownMenuSeparator />
          {onDelete && (
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              Delete {objectType}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  // Get primary field for title
  const primaryField = headerFields[0];
  const title = primaryField
    ? record.properties[primaryField.key] || `${objectType} #${record.id}`
    : `${objectType} #${record.id}`;

  // Get avatar/logo value
  const avatarValue = avatarField ? record.properties[avatarField] : null;

  return (
    <div className="space-y-6">
      {/* Header Actions - could be integrated into layout */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {listPath && (
            <Link href={listPath}>
              <Button variant="ghost" size="sm">
                ← Back to {objectType}s
              </Button>
            </Link>
          )}
        </div>
        {headerActions}
      </div>

      {/* Record Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-16 w-16">
              {avatarValue ? (
                <AvatarImage src={avatarValue} alt={title} />
              ) : null}
              <AvatarFallback>
                <AvatarFallbackIcon className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{title}</h1>
                  {headerFields.slice(1).map((field) => {
                    const value = record.properties[field.key];
                    if (!value) return null;

                    return (
                      <p key={field.key} className="text-muted-foreground">
                        {formatFieldValue(
                          value,
                          field.type,
                          record,
                          field.render
                        )}
                      </p>
                    );
                  })}
                </div>

                {/* Status badge */}
                {record.properties.status && (
                  <Badge
                    variant={
                      record.properties.status === "active" ||
                      record.properties.status === "Active"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {record.properties.status}
                  </Badge>
                )}
              </div>

              {/* Contact info grid */}
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {overviewFields
                  .filter(
                    (f) =>
                      f.section === "contact" ||
                      (!f.section &&
                        (f.type === "email" ||
                          f.type === "phone" ||
                          f.type === "url" ||
                          f.icon))
                  )
                  .map((field) => {
                    const value = record.properties[field.key];
                    if (!value) return null;

                    const Icon = field.icon;

                    return (
                      <div key={field.key} className="flex items-center gap-2">
                        {Icon && (
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">
                          {formatFieldValue(
                            value,
                            field.type,
                            record,
                            field.render
                          )}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {metricFields.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          {metricFields.map((field) => {
            const value = record.properties[field.key];
            const Icon = field.icon;

            return (
              <Card key={field.key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    {field.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatFieldValue(value, field.type, record, field.render)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          className={`grid w-full grid-cols-${Math.min(customTabs.length + 2, 5)}`}
        >
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {customTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2"
              >
                {Icon && <Icon className="h-4 w-4" />}
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({tab.count})
                  </span>
                )}
              </TabsTrigger>
            );
          })}
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{objectType} Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {overviewFields
                    .filter((f) => !f.section || f.section === "overview")
                    .map((field) => {
                      const value = record.properties[field.key];

                      return (
                        <div key={field.key}>
                          <label className="text-sm font-medium text-muted-foreground">
                            {field.label}
                          </label>
                          <p>
                            {formatFieldValue(
                              value,
                              field.type,
                              record,
                              field.render
                            )}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{objectType} was created</p>
                      <p className="text-xs text-muted-foreground">
                        {record.createdAt &&
                          formatDistanceToNow(new Date(record.createdAt), {
                            addSuffix: true,
                          })}
                      </p>
                    </div>
                  </div>
                  {record.updatedAt &&
                    record.updatedAt !== record.createdAt && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{objectType} was updated</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(record.updatedAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {customTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-4">
            {tab.content}
          </TabsContent>
        ))}

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Change History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Record history timeline coming soon...</p>
                <p className="text-sm mt-2">
                  This will show the change history for {objectType.toLowerCase()} #{record.id}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
