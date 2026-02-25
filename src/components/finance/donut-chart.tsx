"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = ["#eab308", "#a16207", "#64748b", "#475569", "#0ea5e9"];

export function DonutChart({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Henüz bakiye yok.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="hsl(var(--card))" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value), ""]}
          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
