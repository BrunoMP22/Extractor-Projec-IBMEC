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
              "Você é um extrator OCR de cardápios. Regras estritas:\n" +
              "1. Extraia APENAS itens REALMENTE visíveis na imagem/PDF. NUNCA invente, complete ou imagine pratos, preços ou descrições.\n" +
              "2. Use exatamente o texto do cardápio (mesma língua, mesma grafia, acentos preservados).\n" +
              "3. Preço deve ser número decimal em reais (ex: 29.90). Se ilegível ou ausente, use 0.\n" +
              "4. Para descrição use SOMENTE o que está escrito junto ao item. Se não houver descrição no cardápio, retorne string vazia ''. NÃO gere descrição genérica.\n" +
              "5. Ignore cabeçalhos de seção, endereços, telefones, redes sociais e textos promocionais — só itens vendáveis.\n" +
              "6. Se a imagem não for um cardápio ou estiver ilegível, retorne items: [].",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extraia todos os itens reais deste cardápio respeitando as regras.",
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
