import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Wand2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface Props {
  onCommand: (cmd: string) => void;
}

const SUGGESTIONS = [
  "Aumente todos os preços em 10%",
  "Traduza descrições para inglês",
  "Remova itens sem descrição",
];

export function AdjustPanel({ onCommand }: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Olá! Posso ajustar a extração para você. Diga o que mudar na tabela.",
    },
  ]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [
      ...m,
      { role: "user", text },
      { role: "assistant", text: `Aplicado: "${text}" ✓` },
    ]);
    onCommand(text);
    setInput("");
  };

  return (
    <aside
      className="flex h-full flex-col rounded-2xl border bg-card"
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <div className="flex items-center gap-3 border-b px-5 py-4">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Wand2 className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Ajustar Extração</h3>
          <p className="text-xs text-muted-foreground">Comande a IA em linguagem natural</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-sm text-primary-foreground"
                : "mr-auto max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2 text-sm text-foreground"
            }
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t p-4">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Sparkles className="h-3 w-3" /> {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: Arredonde os preços"
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </aside>
  );
}
