"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { CustomerList } from "@/components/crm/customer-list";
import { AddDirectCustomerForm } from "@/components/crm/add-direct-customer-form";
import type { CustomerWithRelations } from "@/types/crm";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerWithRelations[]>([]);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const loadCustomers = async () => {
    const archived = showArchived ? "true" : "false";
    const res = await fetch(`/api/customers?withContactStatus=1&archived=${archived}`);
    if (res.ok) setCustomers(await res.json());
  };

  useEffect(() => {
    loadCustomers();
  }, [showArchived]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Müşteriler</h1>
          <p className="text-muted-foreground">Aktif müşteriler</p>
        </div>
        <Button onClick={() => setAddCustomerOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Müşteri Ekle
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-3"
      >
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded text-primary"
          />
          Arşivdekileri göster
        </label>
        <CustomerList
          customers={customers}
          onAssignPackage={undefined}
          onUpdated={() => {
            loadCustomers();
            router.refresh();
          }}
          showArchived={showArchived}
        />
      </motion.div>

      <SlideOver open={addCustomerOpen} onClose={() => setAddCustomerOpen(false)} title="Müşteri Ekle">
        <AddDirectCustomerForm
          onSuccess={() => {
            loadCustomers();
            setAddCustomerOpen(false);
            router.refresh();
          }}
          onCancel={() => setAddCustomerOpen(false)}
        />
      </SlideOver>
    </div>
  );
}
