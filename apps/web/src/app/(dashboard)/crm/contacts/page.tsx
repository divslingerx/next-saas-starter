"use client";

/**
 * Contacts Page
 * Uses the PlatformTable component for managing contacts
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@charmlabs/ui/components/button";
import { PlatformTable } from "@/components/crm/platform/PlatformTable";
import { PlatformFilters } from "@/components/crm/platform/PlatformFilters";
import type { FilterGroup, FilterField } from "@/components/crm/platform/PlatformFilters";
import { 
  Plus, 
  Upload, 
  Download,
  Mail,
  Phone,
  User,
  Building2,
  Calendar
} from "lucide-react";
import { Badge } from "@charmlabs/ui/components/badge";
import { Avatar } from "@charmlabs/ui/components/avatar";

export default function ContactsPage() {
  const router = useRouter();
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
  const [globalSearch, setGlobalSearch] = useState("");

  // Fetch contacts using tRPC
  const { data, isLoading } = api.person.search.useQuery({
    query: globalSearch,
    page: 1,
    limit: 50,
  });

  // Define table columns
  const columns = [
    {
      key: "select",
      label: "",
      width: "40px",
      render: (row: any) => (
        <input
          type="checkbox"
          checked={selectedContacts.some(c => c.id === row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedContacts([...selectedContacts, row]);
            } else {
              setSelectedContacts(selectedContacts.filter(c => c.id !== row.id));
            }
          }}
        />
      ),
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <div className="bg-primary/10 flex h-full w-full items-center justify-center">
              <User className="h-4 w-4" />
            </div>
          </Avatar>
          <div>
            <div className="font-medium">{row.fullName}</div>
            <div className="text-sm text-muted-foreground">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "company",
      label: "Company",
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>{row.organizations?.[0]?.organization?.name || "-"}</span>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (row: any) => (
        row.phone ? (
          <a href={`tel:${row.phone}`} className="flex items-center gap-2 text-primary hover:underline">
            <Phone className="h-3 w-3" />
            {row.phone}
          </a>
        ) : "-"
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: any) => {
        if (row.isCustomer) return <Badge variant="default">Customer</Badge>;
        if (row.isLead) return <Badge variant="secondary">Lead</Badge>;
        if (row.isContact) return <Badge variant="outline">Contact</Badge>;
        return <Badge variant="outline">Unknown</Badge>;
      },
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "100px",
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/crm/contacts/${row.id}`)}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      key: "email",
      label: "Email",
      type: "text",
    },
    {
      key: "firstName",
      label: "First Name",
      type: "text",
    },
    {
      key: "lastName",
      label: "Last Name",
      type: "text",
    },
    {
      key: "isCustomer",
      label: "Is Customer",
      type: "boolean",
    },
    {
      key: "isLead",
      label: "Is Lead",
      type: "boolean",
    },
    {
      key: "createdAt",
      label: "Created Date",
      type: "date",
    },
  ];

  const handleBulkAction = (action: string) => {
    console.log("Bulk action:", action, selectedContacts);
    // Implement bulk actions
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contacts</h2>
          <p className="text-muted-foreground">
            Manage your contacts and customer relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => router.push("/crm/contacts/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Contact
          </Button>
        </div>
      </div>

      <PlatformFilters
        fields={filterFields}
        filterGroups={filterGroups}
        onFiltersChange={setFilterGroups}
        onClear={() => setFilterGroups([])}
      />

      <PlatformTable
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        selectedRows={selectedContacts}
        onSelectionChange={setSelectedContacts}
        onGlobalSearchChange={setGlobalSearch}
        bulkActions={[
          { label: "Send Email", action: () => handleBulkAction("email") },
          { label: "Add Tags", action: () => handleBulkAction("tag") },
          { label: "Delete", action: () => handleBulkAction("delete"), variant: "destructive" },
        ]}
        pagination={{
          page: 1,
          totalPages: data?.pagination.totalPages || 1,
          onPageChange: (page) => console.log("Page:", page),
        }}
      />
    </div>
  );
}