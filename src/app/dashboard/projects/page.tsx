"use client";

import { useEffect, useState } from "react";
import { Project } from "@/types";
import { ProjectList } from "@/components/projects/project-list";
import { ProjectForm } from "@/components/projects/project-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const archived = showArchived ? "true" : "false";
      const res = await fetch(`/api/projects?archived=${archived}`);
      if (!res.ok) throw new Error("Projeler yüklenemedi");
      const data = await res.json();
      setProjects(data.documents || []);
    } catch (error) {
      toast.error("Hata: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [showArchived]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projeler</h1>
          <p className="text-muted-foreground">
            Aktif projeleri ve durumlarını yönetin.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Proje
        </Button>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded text-primary"
          />
          Arşivdekileri göster
        </label>
        <ProjectList
          projects={projects}
          loading={loading}
          onRefresh={fetchProjects}
          showArchived={showArchived}
        />
      </div>

      <ProjectForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        onSuccess={fetchProjects} 
      />
    </div>
  );
}
