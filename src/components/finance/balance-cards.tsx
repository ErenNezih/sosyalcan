"use client";

type Balance = {
  id: string;
  bucket: string;
  balance: string;
  userId: string | null;
  user: { id: string; name: string | null } | null;
};

const LABELS: Record<string, string> = {
  EREN: "Kullanıcı 1 (%30)",
  KERIM: "Kullanıcı 2 (%30)",
  GIDER: "Gider Hesabı (%15)",
  BIRIKIM: "Birikim (%15)",
  ACIL_DURUM: "Acil Durum / Kasa (%10)",
};

export function BalanceCards({ balances }: { balances: Balance[] }) {
  if (balances.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center text-muted-foreground">
        Henüz işlem yok.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {balances.map((b) => (
        <div
          key={b.id}
          className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
        >
          <span className="font-medium">{LABELS[b.bucket] ?? b.bucket}</span>
          <span className="text-primary">
            {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(b.balance))}
          </span>
        </div>
      ))}
    </div>
  );
}
