import { useCallback, useState } from "react";
import { Upload, FileImage, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onUpload: (files: File[]) => void;
}

export function UploadZone({ onUpload }: Props) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onUpload(files);
    },
    [onUpload],
  );

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed bg-card p-12 text-center transition-all",
        dragging
          ? "border-primary bg-accent/40 scale-[1.01]"
          : "border-border hover:border-primary/50 hover:bg-accent/20",
      )}
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl text-primary-foreground transition-transform group-hover:scale-105"
        style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elegant)" }}
      >
        <Upload className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">
          Arraste seu cardápio aqui
        </h3>
        <p className="text-sm text-muted-foreground">
          ou <span className="font-medium text-primary">clique para selecionar</span> um arquivo
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
          <FileImage className="h-3.5 w-3.5" /> PNG, JPG
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
          <FileText className="h-3.5 w-3.5" /> PDF
        </span>
      </div>
      <input
        type="file"
        accept="image/png,image/jpeg,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onUpload(Array.from(e.target.files));
        }}
      />
    </label>
  );
}
