import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { tenderId, messages } = await req.json();
    if (!tenderId || !messages) throw new Error("Missing tenderId or messages");

    // Fetch tender context
    const { data: tender, error } = await supabase
      .from("tenders")
      .select("*")
      .eq("id", tenderId)
      .single();

    if (error || !tender) throw new Error("Tender not found");

    const tenderContext = `
CONTEXTO DO EDITAL:
- Título: ${tender.title}
- Órgão: ${tender.organization || "N/A"}
- Categoria: ${tender.category}
- Valor Estimado: ${tender.value_estimate ? `R$ ${tender.value_estimate}` : "N/A"}
- Prazo: ${tender.deadline || "N/A"}
- Local: ${tender.location || "N/A"}
- Resumo IA: ${tender.ai_summary || "N/A"}
- Requisitos: ${tender.requirements ? tender.requirements.join("; ") : "N/A"}
- Insights: ${tender.ai_insights ? JSON.stringify(tender.ai_insights) : "N/A"}
- Descrição: ${tender.description || "N/A"}
`;

    const systemPrompt = `Você é um assistente especialista em licitações públicas brasileiras. 
Você tem acesso ao seguinte edital e deve responder perguntas sobre ele com precisão.
Seja objetivo, cite trechos relevantes quando possível, e forneça recomendações práticas.

${tenderContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error (${status})`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("chat-tender error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
