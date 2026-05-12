import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";

export function ProcessingState({ progress }: { progress: number }) {
  return (
    <div
      className="rounded-2xl border bg-card p-6"
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <div className="mb-5 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            Analisando cardápio...
          </p>
          <p className="text-xs text-muted-foreground">
            A IA está extraindo produtos, preços e descrições
          </p>
        </div>
        <span className="text-sm font-medium text-primary tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>
      <Progress value={progress} className="mb-6 h-1.5" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
