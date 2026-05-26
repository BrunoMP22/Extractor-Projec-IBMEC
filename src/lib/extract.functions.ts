import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const ItemSchema = z.object({
  name: z.string(),
  price: z.union([z.number(), z.string()]).transform((v) => {
    if (typeof v === "number") return v;
    const n = parseFloat(String(v).replace(/[^\d,.\-]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }).nullable().optional().transform((v) => v ?? 0),
  description: z.string().nullable().optional().transform((v) => v ?? ""),
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

    const systemPrompt =
      "Você é um extrator OCR de cardápios. Regras:\n" +
      "1. Extraia APENAS itens REALMENTE visíveis. NUNCA invente.\n" +
      "2. Preserve grafia e acentos.\n" +
      "3. Preço: número decimal em reais (ex: 29.90). Se ilegível/ausente, use 0.\n" +
      "4. ASSOCIAÇÃO DE DESCRIÇÃO (CRÍTICO): analise a estrutura visual do documento (blocos, colunas, espaçamento, alinhamento, separadores, agrupamentos tipográficos). Associe nome, descrição e preço SOMENTE quando fizerem parte do MESMO bloco visual do prato.\n" +
      "   - NUNCA reutilize a mesma descrição em pratos diferentes.\n" +
      "   - NUNCA herde a descrição de um item vizinho (acima, abaixo, ao lado) só por proximidade física.\n" +
      "   - Se houver QUALQUER dúvida sobre a qual prato a descrição pertence, deixe description = '' em vez de adivinhar.\n" +
      "   - Uma descrição só é válida se estiver claramente agrupada (mesmo bloco/cartão/parágrafo) com o nome do prato.\n" +
      "5. Ignore cabeçalhos, endereços, telefones, redes sociais, promoções, categorias e seções.\n" +
      "6. Se não for cardápio ou estiver ilegível, retorne items: [].";

    const userContent = [
      { type: "text" as const, text: "Extraia todos os itens reais deste cardápio." },
      { type: "file" as const, data: data.fileBase64, mediaType: data.mimeType },
    ];

    try {
      // Tentativa 1: structured output
      try {
        const { experimental_output } = await generateText({
          model,
          output: Output.object({ schema: ResultSchema }),
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
        });
        return { items: experimental_output.items, error: null };
      } catch (structuredErr) {
        console.warn("Structured output falhou, tentando fallback JSON:", structuredErr instanceof Error ? structuredErr.message : structuredErr);
      }

      // Fallback: pedir JSON puro e parsear
      const { text } = await generateText({
        model,
        messages: [
          {
            role: "system",
            content:
              systemPrompt +
              '\n\nResponda APENAS com JSON válido no formato: {"items":[{"name":"...","price":0,"description":"..."}]} sem markdown, sem texto extra.',
          },
          { role: "user", content: userContent },
        ],
      });

      const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      const jsonStart = cleaned.indexOf("{");
      const jsonEnd = cleaned.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) {
        return { items: [], error: "Não consegui interpretar a resposta da IA." };
      }
      const raw = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
      const parsed = ResultSchema.safeParse(raw);
      if (!parsed.success) {
        console.error("Fallback parse falhou:", parsed.error.message);
        return { items: [], error: "Formato inesperado retornado pela IA." };
      }
      return { items: parsed.data.items, error: null };
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
