import { getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { mapDocumentList, Query } from "@/lib/appwrite/helpers";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export async function LeadStreamTable() {
  try {
    const { databases } = getAppwriteAdmin();
    const res = await databases.listDocuments(APPWRITE.databaseId, APPWRITE.collections.leads, [
      Query.orderDesc("$createdAt"),
      Query.limit(20),
    ]);
    const leads = mapDocumentList(res);

    if (leads.length === 0) {
      return (
        <div className="glass-card rounded-lg p-8 text-center text-muted-foreground">
          Henüz vitrinden düşen etkileşim yok.
        </div>
      );
    }

    return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th className="px-4 py-3 font-medium">Tarih</th>
            <th className="px-4 py-3 font-medium">Ad</th>
            <th className="px-4 py-3 font-medium">E-posta</th>
            <th className="px-4 py-3 font-medium">Kaynak</th>
            <th className="px-4 py-3 font-medium">Durum</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const convertedAt = (lead as unknown as { converted_at?: string }).converted_at;
            const source = (lead as unknown as { source?: string }).source ?? "manual";
            return (
              <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 text-muted-foreground">
                  {format(lead.createdAt, "d MMM yyyy, HH:mm", { locale: tr })}
                </td>
                <td className="px-4 py-3">{(lead as unknown as { name: string }).name}</td>
                <td className="px-4 py-3">{(lead as unknown as { email: string }).email}</td>
                <td className="px-4 py-3">
                  <span className={source === "vitrin" ? "text-primary" : "text-muted-foreground"}>
                    {source === "vitrin" ? "Vitrin" : "Manuel"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {convertedAt ? (
                    <span className="text-primary">Müşteriye dönüştü</span>
                  ) : (
                    <span className="text-muted-foreground">Potansiyel</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("DASHBOARD_SSR_ERROR LeadStreamTable:", error);
    }
    return (
      <div className="glass-card rounded-lg p-8 text-center text-muted-foreground">
        Veri yüklenirken bir hata oluştu.
      </div>
    );
  }
}
