import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { UploadZone } from "@/components/edi/UploadZone";
import { ProcessingState } from "@/components/edi/ProcessingState";
import { DataTable, type MenuItem } from "@/components/edi/DataTable";
import { AdjustPanel } from "@/components/edi/AdjustPanel";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

const MOCK: MenuItem[] = [
  { id: "1", name: "Bruschetta de Tomate", price: 28.9, description: "Pão italiano tostado com tomate, manjericão e azeite extra virgem." },
  { id: "2", name: "Risoto de Funghi", price: 64.5, description: "Arroz arbóreo com mix de cogumelos, vinho branco e parmesão." },
  { id: "3", name: "Filé ao Molho Madeira", price: 89.0, description: "Filé mignon grelhado, molho madeira e batatas rústicas." },
  { id: "4", name: "Salmão Grelhado", price: 78.0, description: "Salmão fresco com legumes salteados e purê de batata baroa." },
  { id: "5", name: "Pizza Margherita", price: 52.0, description: "Massa artesanal, molho de tomate, mussarela de búfala e manjericão." },
  { id: "6", name: "Tiramisù", price: 24.0, description: "Sobremesa italiana com café, mascarpone e cacau." },
];

type State = "idle" | "processing" | "ready";

function Index() {
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [items, setItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    if (state !== "processing") return;
    setProgress(0);
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(t);
          setItems(MOCK);
          setState("ready");
          toast.success("Cardápio analisado com sucesso");
          return 100;
        }
        return p + 8;
      });
    }, 180);
    return () => clearInterval(t);
  }, [state]);

  const handleUpload = (files: File[]) => {
    toast(`${files.length} arquivo(s) recebido(s)`, { description: files[0]?.name });
    setState("processing");
  };

  const handleClear = () => {
    setItems([]);
    setState("idle");
    toast("Tabela limpa");
  };

  const handleExport = (format: "csv" | "xlsx") => {
    toast.success(`Exportando para ${format.toUpperCase()}`);
  };

  const handleCommand = (cmd: string) => {
    if (/aumente.*(\d+)\s*%/i.test(cmd)) {
      const pct = Number(cmd.match(/(\d+)\s*%/)?.[1] ?? 0);
      setItems((prev) => prev.map((i) => ({ ...i, price: +(i.price * (1 + pct / 100)).toFixed(2) })));
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-subtle)" }}>
      <Toaster />
      <header className="border-b bg-background/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elegant)" }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-foreground">E.D.I.</h1>
              <p className="text-xs text-muted-foreground">Extrator de Dados Inteligente</p>
            </div>
          </div>
          <span className="hidden rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground sm:inline">
            v1.0 · beta
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Transforme cardápios em dados estruturados
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Envie uma imagem ou PDF e a IA extrai produtos, preços e descrições automaticamente.
            </p>
          </div>

          {state === "idle" && <UploadZone onUpload={handleUpload} />}
          {state === "processing" && <ProcessingState progress={progress} />}
          {state === "ready" && (
            <>
              <DataTable items={items} onClear={handleClear} onExport={handleExport} />
              <UploadZone onUpload={handleUpload} />
            </>
          )}
        </section>

        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-7rem)]">
          <AdjustPanel onCommand={handleCommand} />
        </div>
      </main>
    </div>
  );
}
