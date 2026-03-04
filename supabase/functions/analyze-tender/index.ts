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

    const { tenderId, filePath } = await req.json();
    if (!tenderId || !filePath) throw new Error("Missing tenderId or filePath");

    console.log("Starting analysis for tender:", tenderId, "file:", filePath);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("tender-files")
      .download(filePath);

    if (downloadError) {
      console.error("Download error:", downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    console.log("PDF size:", arrayBuffer.byteLength, "bytes, base64 length:", base64.length);

const systemPrompt = `Você é um especialista em licitações brasileiras.
Extraia dados do PDF e responda APENAS com JSON válido. Sem markdown, sem code blocks.

REGRA DE OURO: MÁXIMO 10 palavras por campo de texto. Sem frases longas. Sem parágrafos.
Cada item de lista: máximo 8 palavras.
Summary: máximo 2 frases de 10 palavras cada.
Risks/opportunities/recommendations: máximo 3 itens, 8 palavras cada, separados por |

JSON exato:
{
  "title": "título curto do edital (max 15 palavras)",
  "description": "objeto em 1 frase curta (max 10 palavras)",
  "organization": "nome do órgão",
  "category": "obras|servicos|compras|tecnologia|saude|educacao|outros",
  "value_estimate": null ou número,
  "deadline": null ou "YYYY-MM-DD",
  "location": "cidade/UF",
  "requirements": ["req curto 1", "req curto 2"],
  "contact_info": {"email": "", "phone": "", "address": "", "responsible": ""},
  "summary": "2 frases curtas. Máximo 20 palavras total.",
  "insights": {
    "risks": "risco 1 | risco 2 | risco 3",
    "opportunities": "oportunidade 1 | oportunidade 2",
    "recommendations": "recomendação 1 | recomendação 2",
    "compliance_checklist": ["item curto", "item curto"],
    "key_dates": [{"date": "YYYY-MM-DD", "description": "evento (3 palavras)"}],
    "estimated_complexity": "baixa|média|alta",
    "modality": "tipo da modalidade",
    "score": 0-100,
    "atestados_tecnicos": [
      {
        "descricao": "descrição curta (max 8 palavras)",
        "quantidade": "ex: 50% do quantitativo",
        "especialidade": "área técnica",
        "tipo": "profissional|empresa",
        "obrigatorio": true|false
      }
    ],
    "total_atestados": número,
    "complexidade_atestados": "baixa|média|alta"
  }
}`;

    // Call Lovable AI with the PDF
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise este edital de licitação em detalhes e extraia todas as informações solicitadas no formato JSON especificado."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errBody = await aiResponse.text();
      console.error("AI gateway error:", status, errBody);
      
      if (status === 429) {
        // Update status back to new so user can retry
        await supabase.from("tenders").update({ status: "new" }).eq("id", tenderId);
        throw new Error("Limite de requisições excedido. Tente novamente em alguns segundos.");
      }
      if (status === 402) {
        await supabase.from("tenders").update({ status: "new" }).eq("id", tenderId);
        throw new Error("Créditos de IA esgotados. Adicione créditos para continuar.");
      }
      throw new Error(`Erro na análise de IA (${status})`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    console.log("AI response length:", content.length);

    // Parse the JSON response
    let parsed: any;
    try {
      const cleaned = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      // Fallback: store raw content as summary
      parsed = {
        summary: content,
        insights: {
          risks: "Não foi possível extrair riscos automaticamente.",
          opportunities: "Análise manual recomendada.",
          recommendations: "Revise o documento manualmente para informações detalhadas."
        }
      };
    }

    // Validate category
    const validCategories = ["obras", "servicos", "compras", "tecnologia", "saude", "educacao", "outros"];
    const category = validCategories.includes(parsed.category) ? parsed.category : "outros";

    // Update tender with all extracted data
    const updateData: any = {
      description: parsed.description || null,
      organization: parsed.organization || null,
      category,
      value_estimate: parsed.value_estimate || null,
      deadline: parsed.deadline || null,
      location: parsed.location || null,
      requirements: parsed.requirements || null,
      contact_info: parsed.contact_info || null,
      ai_summary: parsed.summary || null,
      ai_insights: parsed.insights || null,
      raw_text: content,
      status: "analyzed",
    };

    // Only update title if AI found a better one and it's not empty
    if (parsed.title && parsed.title.trim().length > 5) {
      updateData.title = parsed.title;
    }

    const { error: updateError } = await supabase
      .from("tenders")
      .update(updateData)
      .eq("id", tenderId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error(`Failed to update tender: ${updateError.message}`);
    }

    console.log("Tender analyzed successfully:", tenderId);

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-tender error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
