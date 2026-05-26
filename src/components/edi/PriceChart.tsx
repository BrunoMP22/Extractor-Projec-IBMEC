import { useRef } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { MenuItem } from "./DataTable";

interface Props {
  items: MenuItem[];
}

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// Paleta moderna — tons de ciano/azul/violeta sobre fundo escuro
const PALETTE = ["#22d3ee", "#38bdf8", "#60a5fa", "#818cf8", "#a78bfa", "#f472b6"];
const AXIS_COLOR = "#94a3b8"; // slate-400
const GRID_COLOR = "rgba(148, 163, 184, 0.18)";
const ACCENT = "#22d3ee";
const ACCENT_SOFT = "rgba(34, 211, 238, 0.12)";
const PANEL_BG = "#0f172a"; // slate-900

export function PriceChart({ items }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleDownload = async () => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) {
      toast.error("Não foi possível capturar o gráfico.");
      return;
    }
    try {
      const cloned = svg.cloneNode(true) as SVGSVGElement;
      const rect = svg.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      cloned.setAttribute("width", String(w));
      cloned.setAttribute("height", String(h));

      // Fundo opaco para o PNG não sair transparente
      const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bg.setAttribute("width", "100%");
      bg.setAttribute("height", "100%");
      bg.setAttribute("fill", PANEL_BG);
      cloned.insertBefore(bg, cloned.firstChild);

      const xml = new XMLSerializer().serializeToString(cloned);
      const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("img load"));
        img.src = url;
      });

      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas ctx");
      ctx.fillStyle = PANEL_BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = dlUrl;
        a.download = "analise-precos.png";
        a.click();
        URL.revokeObjectURL(dlUrl);
      }, "image/png");

      toast.success("Gráfico exportado como PNG");
    } catch (e) {
      console.error(e);
      toast.error("Falha ao exportar o gráfico.");
    }
  };

  return (
    <div
      className="rounded-xl border p-5 shadow-sm"
      style={{ background: PANEL_BG, borderColor: "rgba(148, 163, 184, 0.15)" }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{
              background: "linear-gradient(135deg, #06b6d4, #6366f1)",
              color: "#0f172a",
            }}
          >
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
              Análise de preços
            </h3>
            <p className="text-xs" style={{ color: AXIS_COLOR }}>
              {priced.length} itens com preço — top {data.length} no gráfico
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Stat label="Média" value={brl.format(avg)} highlight />
          <Stat label="Mín" value={brl.format(min)} />
          <Stat label="Máx" value={brl.format(max)} />
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            className="ml-1 h-8 gap-1.5 border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20 hover:text-cyan-100"
          >
            <Download className="h-3.5 w-3.5" />
            PNG
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 56 }}>
            <defs>
              {PALETTE.map((c, i) => (
                <linearGradient id={`barGrad-${i}`} key={i} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={c} stopOpacity={0.55} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
            <XAxis
              dataKey="name"
              angle={-32}
              textAnchor="end"
              interval={0}
              height={60}
              tick={{ fill: "#cbd5e1", fontSize: 11 }}
              stroke={GRID_COLOR}
              tickLine={{ stroke: GRID_COLOR }}
            />
            <YAxis
              tick={{ fill: "#cbd5e1", fontSize: 11 }}
              stroke={GRID_COLOR}
              tickLine={{ stroke: GRID_COLOR }}
              tickFormatter={(v) => brl.format(Number(v))}
              width={88}
            />
            <Tooltip
              cursor={{ fill: ACCENT_SOFT }}
              contentStyle={{
                background: "#0b1220",
                border: "1px solid rgba(34, 211, 238, 0.35)",
                borderRadius: 8,
                fontSize: 12,
                color: "#e2e8f0",
                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.6)",
              }}
              labelStyle={{ color: "#f1f5f9", fontWeight: 600 }}
              itemStyle={{ color: ACCENT }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ""}
              formatter={(v: number) => [brl.format(v), "Preço"]}
            />
            <ReferenceLine
              y={avg}
              stroke={ACCENT}
              strokeDasharray="5 5"
              strokeWidth={1.5}
              label={{
                value: `Média ${brl.format(avg)}`,
                position: "insideTopRight",
                fill: ACCENT,
                fontSize: 11,
                fontWeight: 600,
              }}
            />
            <Bar dataKey="price" radius={[8, 8, 0, 0]}>
              {data.map((_, idx) => (
                <Cell key={idx} fill={`url(#barGrad-${idx % PALETTE.length})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p
        className="mt-3 flex items-center gap-1.5 text-xs"
        style={{ color: AXIS_COLOR }}
      >
        <TrendingUp className="h-3.5 w-3.5" style={{ color: ACCENT }} />
        Preço médio do cardápio:{" "}
        <span className="font-semibold" style={{ color: "#f1f5f9" }}>
          {brl.format(avg)}
        </span>
      </p>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="rounded-md border px-2.5 py-1"
      style={
        highlight
          ? {
              borderColor: "rgba(34, 211, 238, 0.4)",
              background: "rgba(34, 211, 238, 0.1)",
            }
          : {
              borderColor: "rgba(148, 163, 184, 0.2)",
              background: "rgba(148, 163, 184, 0.08)",
            }
      }
    >
      <span
        className="mr-1 uppercase tracking-wide"
        style={{ color: highlight ? "#67e8f9" : "#94a3b8", fontSize: 10 }}
      >
        {label}
      </span>
      <span className="font-semibold" style={{ color: "#f1f5f9" }}>
        {value}
      </span>
    </div>
  );
}
