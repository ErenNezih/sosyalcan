"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { LeadDetailDrawer } from "@/components/crm/lead-detail-drawer";
import { CustomerList } from "@/components/crm/customer-list";
import { LeadList } from "@/components/crm/lead-list";
import { AddLeadForm } from "@/components/crm/add-lead-form";
import { AddDirectCustomerForm } from "@/components/crm/add-direct-customer-form";
import type { Lead, CustomerWithRelations } from "@/types/crm";

export default function CustomersPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<CustomerWithRelations[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [assignPackageCustomerId, setAssignPackageCustomerId] = useState<string | null>(null);

  const loadLeads = async () => {
    const res = await fetch("/api/leads");
    if (res.ok) setLeads(await res.json());
  };
  const loadCustomers = async () => {
    const res = await fetch("/api/customers?withContactStatus=1");
    if (res.ok) setCustomers(await res.json());
  };

  useEffect(() => {
    loadLeads();
    loadCustomers();
  }, []);

  const selectedLead = selectedLeadId ? leads.find((l) => l.id === selectedLeadId) : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Müşteriler & CRM</h1>
          <p className="text-muted-foreground">Potansiyeller ve aktif müşteriler</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddLeadOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Potansiyel Ekle
          </Button>
          <Button onClick={() => setAddCustomerOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Aktif Müşteri Ekle
          </Button>
        </div>
      </div>

      <Tabs defaultValue="leads" className="w-full">
        <TabsList>
          <TabsTrigger value="leads">Yeni Potansiyeller / Leads</TabsTrigger>
          <TabsTrigger value="customers">Aktif Müşteriler</TabsTrigger>
        </TabsList>
        <TabsContent value="leads">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LeadList
              leads={leads}
              onSelect={(id) => setSelectedLeadId(id)}
              onConverted={() => {
                loadLeads();
                loadCustomers();
                setSelectedLeadId(null);
              }}
            />
          </motion.div>
        </TabsContent>
        <TabsContent value="customers">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CustomerList
              customers={customers}
              onAssignPackage={(id) => setAssignPackageCustomerId(id)}
              onUpdated={() => {
                loadCustomers();
                setAssignPackageCustomerId(null);
              }}
            />
          </motion.div>
        </TabsContent>
      </Tabs>

      <LeadDetailDrawer
        lead={selectedLead ?? null}
        open={!!selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onConverted={() => {
          loadLeads();
          loadCustomers();
          setSelectedLeadId(null);
        }}
      />

      <SlideOver open={addLeadOpen} onClose={() => setAddLeadOpen(false)} title="Yeni Potansiyel">
        <AddLeadForm
          onSuccess={() => {
            loadLeads();
            setAddLeadOpen(false);
          }}
          onCancel={() => setAddLeadOpen(false)}
        />
      </SlideOver>

      <SlideOver open={addCustomerOpen} onClose={() => setAddCustomerOpen(false)} title="Aktif Müşteri Ekle">
        <AddDirectCustomerForm
          onSuccess={() => {
            loadCustomers();
            setAddCustomerOpen(false);
          }}
          onCancel={() => setAddCustomerOpen(false)}
        />
      </SlideOver>

      <SlideOver
        open={!!assignPackageCustomerId}
        onClose={() => setAssignPackageCustomerId(null)}
        title="Paket Ata"
      >
        {assignPackageCustomerId && (
          <AssignPackageForm
            customerId={assignPackageCustomerId}
            customer={customers.find((c) => c.id === assignPackageCustomerId) ?? null}
            onClose={() => setAssignPackageCustomerId(null)}
            onSuccess={() => {
              loadCustomers();
              setAssignPackageCustomerId(null);
            }}
          />
        )}
      </SlideOver>
    </div>
  );
}

function AssignPackageForm({
  customerId,
  customer,
  onClose,
  onSuccess,
}: {
  customerId: string;
  customer: CustomerWithRelations | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [packageType, setPackageType] = useState<"STARTER" | "PRO" | "PREMIUM">("STARTER");

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageType }),
      });
      if (!res.ok) throw new Error("Failed");
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <p className="text-sm text-muted-foreground">Müşteri</p>
        <p className="font-medium">{customer?.name ?? "-"}</p>
        <p className="text-sm text-muted-foreground">{customer?.email}</p>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium">Paket</p>
        {(["STARTER", "PRO", "PREMIUM"] as const).map((p) => (
          <label key={p} className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="package"
              checked={packageType === p}
              onChange={() => setPackageType(p)}
              className="text-primary"
            />
            <span>
              {p === "STARTER" && "Starter (15.000 TL)"}
              {p === "PRO" && "Pro (22.500 TL)"}
              {p === "PREMIUM" && "Premium (50.000 TL)"}
            </span>
          </label>
        ))}
      </div>
      <div className="sm:col-span-2 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          İptal
        </Button>
        <Button onClick={submit} disabled={loading}>
          {loading ? "Kaydediliyor..." : "Abonelik Oluştur"}
        </Button>
      </div>
    </div>
  );
}
