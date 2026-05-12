import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Trash2, FileSpreadsheet } from "lucide-react";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface Props {
  items: MenuItem[];
  onClear: () => void;
  onExport: (format: "csv" | "xlsx") => void;
}

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function DataTable({ items, onClear, onExport }: Props) {
  return (
    <div
      className="overflow-hidden rounded-2xl border bg-card"
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Dados extraídos
          </h2>
          <p className="text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "itens"} encontrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onExport("csv")}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport("xlsx")}>
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <Trash2 className="h-4 w-4" /> Limpar
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[280px]">Produto</TableHead>
            <TableHead className="w-[140px]">Preço</TableHead>
            <TableHead>Descrição</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium text-foreground">
                {item.name}
              </TableCell>
              <TableCell className="font-mono text-sm tabular-nums text-primary">
                {brl.format(item.price)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {item.description}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
