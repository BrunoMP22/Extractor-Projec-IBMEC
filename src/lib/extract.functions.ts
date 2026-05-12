import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const ItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  description: z.string(),
});

const ResultSchema = z.object({ items: z.array(ItemSchema) });

export const extractMenu = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { fileBase64: string; mimeType: string; fileName?: string }) => input,
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return { items: [], error: "LOVABLE_API_KEY ausente no servidor." };
    }

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-2.5-flash");

    try {
      const { experimental_output } = await generateText({
        model,
        output: Output.object({ schema: ResultSchema }),
        messages: [
          {
            role: "system",
            content:
              "Você extrai itens de cardápios. Retorne todos os pratos/produtos visíveis com nome, preço (number em reais, sem símbolo) e uma descrição curta. Se não houver descrição, gere uma curta a partir do nome. Se preço estiver ilegível, use 0.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extraia todos os itens deste cardápio.",
              },
              {
                type: "file",
                data: data.fileBase64,
                mediaType: data.mimeType,
              },
            ],
          },
        ],
      });

      return { items: experimental_output.items, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("extractMenu failed:", message);
      const status = (err as { status?: number; statusCode?: number })?.status
        ?? (err as { status?: number; statusCode?: number })?.statusCode;
      if (status === 429) {
        return { items: [], error: "Limite de requisições atingido. Tente novamente em instantes." };
      }
      if (status === 402) {
        return { items: [], error: "Créditos esgotados. Adicione créditos em Settings → Workspace → Usage." };
      }
      return { items: [], error: "Falha ao analisar o cardápio. Tente outra imagem ou PDF." };
    }
  });
