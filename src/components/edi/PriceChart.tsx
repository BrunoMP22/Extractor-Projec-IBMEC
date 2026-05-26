import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";
import type { MenuItem } from "./DataTable";

interface Props {
  items: MenuItem[];
}

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function PriceChart({ items }: Props) {
  const priced = items.filter((i) => Number(i.price) > 0);
  if (priced.length < 2) return null;

  const prices = priced.map((i) => i.price);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  const data = priced
    .slice()
    .sort((a, b) => b.price - a.price)
    .slice(0, 20)
    .map((i) => ({
      name: i.name.length > 22 ? i.name.slice(0, 22) + "…" : i.name,
      fullName: i.name,
      price: Number(i.price.toFixed(2)),
    }));

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Análise de preços</h3>
            <p className="text-xs text-muted-foreground">
              {priced.length} itens com preço — top {data.length} no gráfico
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Stat label="Média" value={brl.format(avg)} highlight />
          <Stat label="Mín" value={brl.format(min)} />
          <Stat label="Máx" value={brl.format(max)} />
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 56 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="name"
              angle={-32}
              textAnchor="end"
              interval={0}
              height={60}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              stroke="hsl(var(--border))"
              tickFormatter={(v) => brl.format(Number(v)).replace("R$", "R$ ")}
              width={80}
            />
            <Tooltip
              cursor={{ fill: "color-mix(in oklab, var(--primary) 10%, transparent)" }}
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
                color: "hsl(var(--popover-foreground))",
              }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ""}
              formatter={(v: number) => [brl.format(v), "Preço"]}
            />
            <ReferenceLine
              y={avg}
              stroke="hsl(var(--primary))"
              strokeDasharray="4 4"
              label={{
                value: `Média ${brl.format(avg)}`,
                position: "insideTopRight",
                fill: "hsl(var(--primary))",
                fontSize: 11,
              }}
            />
            <Bar dataKey="price" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5" />
        Preço médio do cardápio: <span className="font-medium text-foreground">{brl.format(avg)}</span>
      </p>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-md border px-2.5 py-1 ${
        highlight ? "border-primary/40 bg-primary/10 text-foreground" : "bg-muted/40 text-muted-foreground"
      }`}
    >
      <span className="mr-1 uppercase tracking-wide opacity-70">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
