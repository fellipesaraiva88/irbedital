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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const { tenderId, filePath } = await req.json();
    if (!tenderId || !filePath) throw new Error("Missing tenderId or filePath");

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("tender-files")
      .download(filePath);

    if (downloadError) throw new Error(`Failed to download file: ${downloadError.message}`);

    // Convert to base64 for AI processing
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    console.log("Sending PDF to AI for analysis, size:", arrayBuffer.byteLength);

    // Call Lovable AI to analyze the PDF
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em análise de licitações e editais públicos brasileiros. Analise o documento PDF fornecido e extraia informações estruturadas. Responda APENAS com um JSON válido no seguinte formato, sem markdown:
{
  "title": "título do edital",
  "description": "descrição resumida",
  "organization": "órgão/entidade responsável",
  "category": "obras|servicos|compras|tecnologia|saude|educacao|outros",
  "value_estimate": número ou null,
  "deadline": "YYYY-MM-DD" ou null,
  "location": "cidade/estado",
  "requirements": ["requisito 1", "requisito 2"],
  "contact_info": {"email": "", "phone": "", "address": ""},
  "summary": "resumo detalhado do edital em 3-5 parágrafos",
  "insights": {
    "risks": "análise de riscos",
    "opportunities": "oportunidades identificadas",
    "recommendations": "recomendações para participação"
  }
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise este edital de licitação e extraia as informações solicitadas."
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
      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded. Tente novamente em alguns segundos.");
      }
      if (aiResponse.status === 402) {
        throw new Error("Créditos de IA esgotados.");
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("Erro na análise de IA");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse the JSON response
    let parsed: any;
    try {
      // Remove markdown code blocks if present
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      // Fallback: store raw text as summary
      parsed = { summary: content, insights: {} };
    }

    // Update tender with extracted data
    const { error: updateError } = await supabase
      .from("tenders")
      .update({
        title: parsed.title || undefined,
        description: parsed.description,
        organization: parsed.organization,
        category: parsed.category || "outros",
        value_estimate: parsed.value_estimate,
        deadline: parsed.deadline,
        location: parsed.location,
        requirements: parsed.requirements,
        contact_info: parsed.contact_info,
        ai_summary: parsed.summary,
        ai_insights: parsed.insights,
        status: "analyzed",
      })
      .eq("id", tenderId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error(`Failed to update tender: ${updateError.message}`);
    }

    console.log("Tender analyzed successfully:", tenderId);

    return new Response(JSON.stringify({ success: true }), {
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
