"use client";
import { Plus } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import ClientTable from "../../components/ClientTable";
import { useStore } from "../../components/store";
import { Button } from "../../components/ui";
import { RETURN_TYPES } from "../../lib/data";

export default function ClientsPage() {
  const { yearClients, taxYear, isArchived } = useStore();
  const byType = RETURN_TYPES.map((t) => `${yearClients.filter((c) => c.type === t).length} × ${t}`).join(" · ");

  return (
    <div className="page">
      <PageHeader
        title="Clients"
        description={`Tax year ${taxYear} · ${yearClients.length} clients in this sample · ${byType}`}
        actions={
          !isArchived && (
            <Button icon={Plus} href="/intake">
              New intake
            </Button>
          )
        }
      />
      <ClientTable key={taxYear} pageSize={15} title="All clients" />
    </div>
  );
}
