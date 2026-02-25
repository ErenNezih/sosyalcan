"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Bell, History } from "lucide-react";

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  payload: unknown;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
};

export default function SettingsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetch("/api/audit?limit=50")
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []));
  }, []);

  const safeLogs = Array.isArray(logs) ? logs : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Ayarlar</h1>
        <p className="text-muted-foreground">Sistem ve bildirim ayarları</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Tabs defaultValue="audit">
          <TabsList>
            <TabsTrigger value="audit">Operasyonel Hafıza (Audit Log)</TabsTrigger>
            <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
          </TabsList>
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Kim, Ne Zaman, Ne Yaptı?
                </CardTitle>
              </CardHeader>
              <CardContent>
                {safeLogs.length === 0 ? (
                  <p className="text-muted-foreground">Henüz kayıt yok.</p>
                ) : (
                  <div className="space-y-2 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-muted-foreground">
                          <th className="pb-2 pr-4">Tarih</th>
                          <th className="pb-2 pr-4">Kullanıcı</th>
                          <th className="pb-2 pr-4">Aksiyon</th>
                          <th className="pb-2 pr-4">Entity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {safeLogs.map((log) => (
                          <tr key={log.id} className="border-b border-white/5">
                            <td className="py-2 pr-4 text-muted-foreground">
                              {format(new Date(log.createdAt), "d MMM yyyy, HH:mm", { locale: tr })}
                            </td>
                            <td className="py-2 pr-4">{log.user?.name ?? log.user?.email ?? "-"}</td>
                            <td className="py-2 pr-4 font-medium">{log.action}</td>
                            <td className="py-2 pr-4">
                              {log.entityType} #{log.entityId.slice(0, 8)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Bildirim Tercihleri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Bildirimler sağ alt köşede toast olarak gösterilir. Yeni lead veya görev tamamlandığında anlık bildirim alırsınız.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
