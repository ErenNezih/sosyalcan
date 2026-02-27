"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CustomerWithRelations, ContactLog } from "@/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactLogList } from "@/components/crm/contact-log-list";
import { ContactLogForm } from "@/components/crm/contact-log-form";
import { ArrowLeft, Phone, Mail, Building, Plus } from "lucide-react";
import { toast } from "sonner";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerWithRelations | null>(null);
  const [contactLogs, setContactLogs] = useState<ContactLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch customer details (assuming existing API supports getting by ID or we need to filter list)
      // Actually, existing API /api/customers returns list.
      // I should check if /api/customers/[id] exists. If not, I'll filter list or add route.
      // Assuming I need to add route or filter.
      // Let's try to fetch list and find.
      const customerRes = await fetch(`/api/customers`);
      if (!customerRes.ok) throw new Error("Müşteri bulunamadı");
      const customersData = await customerRes.json();
      const found = customersData.find((c: any) => c.id === id);
      
      if (!found) throw new Error("Müşteri bulunamadı");
      setCustomer(found);

      const logsRes = await fetch(`/api/contacts?customerId=${id}`);
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setContactLogs(logsData.documents || []);
      }
    } catch (error) {
      toast.error("Hata: " + (error as Error).message);
      router.push("/dashboard/customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  if (loading || !customer) {
    return <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{customer.name}</h1>
          <p className="text-muted-foreground text-sm">{customer.company}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-card p-6 space-y-4">
            <h3 className="font-medium">İletişim Bilgileri</h3>
            <div className="space-y-3 text-sm">
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${customer.email}`} className="hover:underline">{customer.email}</a>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${customer.phone}`} className="hover:underline">{customer.phone}</a>
                </div>
              )}
              {customer.company && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.company}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <Tabs defaultValue="contacts">
            <TabsList>
              <TabsTrigger value="contacts">İletişim Geçmişi</TabsTrigger>
              <TabsTrigger value="projects">Projeler</TabsTrigger>
            </TabsList>
            <TabsContent value="contacts" className="space-y-4 pt-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setIsContactFormOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Kayıt Ekle
                </Button>
              </div>
              <ContactLogList logs={contactLogs} />
            </TabsContent>
            <TabsContent value="projects" className="pt-4">
              <div className="text-center text-muted-foreground">
                Projeler sekmesi yapım aşamasında.
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ContactLogForm 
        open={isContactFormOpen} 
        onOpenChange={setIsContactFormOpen} 
        customerId={customer.id} 
        onSuccess={fetchData} 
      />
    </div>
  );
}
