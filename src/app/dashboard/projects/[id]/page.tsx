"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Project, Deliverable } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeliverableList } from "@/components/projects/deliverable-list";
import { DeliverableForm } from "@/components/projects/deliverable-form";
import { ProjectForm } from "@/components/projects/project-form";
import { ArrowLeft, Calendar, Pencil, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [showArchivedDeliverables, setShowArchivedDeliverables] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const archived = showArchivedDeliverables ? "true" : "false";
      const [projectRes, deliverablesRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/deliverables?projectId=${id}&archived=${archived}`),
      ]);

      if (!projectRes.ok) throw new Error("Çekim bulunamadı");
      
      const projectData = await projectRes.json();
      setProject(projectData);

      if (deliverablesRes.ok) {
        const deliverablesData = await deliverablesRes.json();
        setDeliverables(deliverablesData.documents || []);
      }
    } catch (error) {
      toast.error("Hata: " + (error as Error).message);
      router.push("/dashboard/projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id, showArchivedDeliverables]);

  if (loading || !project) {
    return <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              {project.name}
              <Badge variant="outline" className="ml-2">
                {project.status}
              </Badge>
            </h1>
            <p className="text-muted-foreground text-sm">
              Oluşturulma: {format(new Date(project.createdAt || ""), "d MMM yyyy", { locale: tr })}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditFormOpen(true)}>
          <Pencil className="h-4 w-4" />
          Çekimi Düzenle
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="col-span-2 space-y-6">
          <div className="rounded-lg border border-white/10 bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-medium">Teslim Kalemleri</h2>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showArchivedDeliverables}
                    onChange={(e) => setShowArchivedDeliverables(e.target.checked)}
                    className="rounded text-primary"
                  />
                  Arşivdekileri göster
                </label>
              </div>
              <Button size="sm" onClick={() => setIsFormOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Ekle
              </Button>
            </div>
            <DeliverableList deliverables={deliverables} onRefresh={fetchData} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-card p-6 space-y-4">
            <h3 className="font-medium">Çekim Detayları</h3>
            
            <div className="space-y-3 text-sm">
              {(project as { shootType?: string }).shootType && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tür</span>
                  <span className="capitalize">{(project as { shootType?: string }).shootType}</span>
                </div>
              )}
              {(project as { assignee?: { name: string } }).assignee && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Atanan</span>
                  <span>{(project as { assignee: { name: string } }).assignee.name}</span>
                </div>
              )}
              {(project as { customer?: { name: string } }).customer && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Müşteri</span>
                  <span>{(project as { customer: { name: string } }).customer.name}</span>
                </div>
              )}
              {(project as { location?: string }).location && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Konum</span>
                  <span>{(project as { location: string }).location}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Başlangıç
                </span>
                <span>{project.startDate ? format(new Date(project.startDate), "d MMM yyyy HH:mm", { locale: tr }) : "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Bitiş
                </span>
                <span className={(project as { endAt?: string }).endAt || project.dueDate ? "text-red-400" : ""}>
                  {((project as { endAt?: string }).endAt || project.dueDate)
                    ? format(new Date((project as { endAt?: string }).endAt || project.dueDate!), "d MMM yyyy HH:mm", { locale: tr })
                    : "-"}
                </span>
              </div>
              {project.budget != null && project.budget > 0 && (
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Wallet className="h-4 w-4" /> Bütçe
                  </span>
                  <span className="font-medium text-green-400">
                    {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(project.budget)}
                  </span>
                </div>
              )}
            </div>

            {project.notes && (
              <div className="pt-4 border-t border-white/5">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">NOTLAR</h4>
                <p className="text-sm whitespace-pre-wrap">{project.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <DeliverableForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        projectId={project.id} 
        onSuccess={fetchData} 
      />

      <ProjectForm
        open={isEditFormOpen}
        onOpenChange={setIsEditFormOpen}
        onSuccess={() => { fetchData(); setIsEditFormOpen(false); }}
        projectId={project.id}
        initialData={{
          title: project.name,
          shootType: (project as { shootType?: "video" | "drone" }).shootType ?? "video",
          startAt: (project.startDate || project.start_date)
            ? new Date(project.startDate || project.start_date!).toISOString().slice(0, 16)
            : "",
          endAt: ((project as { endAt?: string }).endAt || project.dueDate || project.due_date)
            ? new Date((project as { endAt?: string }).endAt || project.dueDate || project.due_date!).toISOString().slice(0, 16)
            : "",
          customerId: project.customerId ?? project.customer_id ?? undefined,
          assigneeId: (project as { assigneeId?: string }).assigneeId ?? undefined,
          location: (project as { location?: string }).location ?? undefined,
          notes: project.notes ?? undefined,
          status: ["planlandi", "cekimde", "kurgu", "revize", "teslim"].includes(project.status)
            ? project.status
            : "planlandi",
        }}
      />
    </div>
  );
}
