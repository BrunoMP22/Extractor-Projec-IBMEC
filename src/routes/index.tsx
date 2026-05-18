import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { UploadZone } from "@/components/edi/UploadZone";
import { ProcessingState } from "@/components/edi/ProcessingState";
import { DataTable, type MenuItem } from "@/components/edi/DataTable";
import { AdjustPanel } from "@/components/edi/AdjustPanel";
import { Toaster } from "@/components/ui/sonner";
import { extractMenu } from "@/lib/extract.functions";

export const Route = createFileRoute("/")({
  component: Index,
});

type State = "idle" | "processing" | "ready";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function Index() {
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [items, setItems] = useState<MenuItem[]>([]);
  const extract = useServerFn(extractMenu);

  const handleUpload = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const allowed = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/heic",
      "image/heif",
      "image/gif",
      "application/pdf",
    ];
    if (!allowed.includes(file.type)) {
      toast.error("Formato não suportado", {
        description: "Envie PNG, JPG, WEBP, HEIC, GIF ou PDF.",
      });
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      toast.error("Arquivo muito grande", { description: "Máximo 30 MB." });
      return;
    }

    setState("processing");
    setProgress(8);
    const interval = setInterval(() => {
      setProgress((p) => (p < 88 ? p + Math.random() * 6 : p));
    }, 350);

    try {
      const fileBase64 = await fileToBase64(file);
      const result = await extract({
        data: { fileBase64, mimeType: file.type, fileName: file.name },
      });
      clearInterval(interval);
      setProgress(100);

      if (result.error) {
        toast.error("Não foi possível extrair", { description: result.error });
        setState("idle");
        return;
      }
      if (!result.items.length) {
        toast.warning("Nenhum item encontrado no cardápio.");
        setState("idle");
        return;
      }

      setItems(
        result.items.map((it, idx) => ({
          id: `${Date.now()}-${idx}`,
          name: it.name,
          price: Number(it.price) || 0,
          description: it.description ?? "",
        })),
      );
      setState("ready");
      toast.success(`${result.items.length} itens extraídos`);
    } catch (err) {
      clearInterval(interval);
      console.error(err);
      toast.error("Erro inesperado ao processar o arquivo.");
      setState("idle");
    }
  };

  const handleClear = () => {
    setItems([]);
    setState("idle");
    toast("Tabela limpa");
  };

  const handleExport = async (format: "csv" | "xlsx") => {
    if (!items.length) return;
    const XLSX = await import("xlsx");

    const rows = items.map((i, idx) => ({
      "#": idx + 1,
      Produto: i.name,
      "Preço (R$)": Number(i.price.toFixed(2)),
      Descrição: i.description || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 38 },
      { wch: 14 },
      { wch: 60 },
    ];
    // Formata coluna de preço como moeda BRL
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    for (let r = 1; r <= range.e.r; r++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r, c: 2 })];
      if (cell) cell.z = '"R$" #,##0.00';
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cardápio");

    if (format === "xlsx") {
      XLSX.writeFile(workbook, "cardapio.xlsx", { bookType: "xlsx" });
    } else {
      // CSV UTF-8 com BOM + separador ';' (Excel pt-BR abre em colunas e respeita acentos/Ç)
      const csvBody = XLSX.utils.sheet_to_csv(worksheet, { FS: ";", RS: "\r\n" });
      const bom = "\ufeff";
      const blob = new Blob([bom + csvBody], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cardapio.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
    toast.success(`Exportado como ${format.toUpperCase()}`);
  };

  const handleCommand = (cmd: string) => {
    const pctMatch = cmd.match(/aumente.*?(\d+(?:[.,]\d+)?)\s*%/i);
    const decMatch = cmd.match(/(?:diminua|reduza).*?(\d+(?:[.,]\d+)?)\s*%/i);
    if (pctMatch) {
      const pct = Number(pctMatch[1].replace(",", "."));
      setItems((prev) => prev.map((i) => ({ ...i, price: +(i.price * (1 + pct / 100)).toFixed(2) })));
      return;
    }
    if (decMatch) {
      const pct = Number(decMatch[1].replace(",", "."));
      setItems((prev) => prev.map((i) => ({ ...i, price: +(i.price * (1 - pct / 100)).toFixed(2) })));
      return;
    }
    if (/arredonde/i.test(cmd)) {
      setItems((prev) => prev.map((i) => ({ ...i, price: Math.round(i.price) })));
      return;
    }
    if (/remova.*sem descri/i.test(cmd)) {
      setItems((prev) => prev.filter((i) => i.description.trim().length > 0));
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
            powered by AI
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
