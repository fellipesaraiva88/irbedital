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

    const { filePath, fileName } = await req.json();
    if (!filePath) throw new Error("Missing filePath");

    console.log("Extracting professionals from:", filePath);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("tender-files")
      .download(filePath);

    if (downloadError) throw new Error(`Failed to download file: ${downloadError.message}`);

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    console.log("PDF size:", arrayBuffer.byteLength, "bytes");

    const systemPrompt = `Você é um especialista em extração de dados de profissionais de saúde a partir de documentos PDF.
Analise o documento e extraia a lista completa de profissionais.

IMPORTANTE: Responda APENAS com JSON válido, sem markdown, sem code blocks.

O JSON deve ser um array com esta estrutura:
[
  {
    "name": "nome completo do profissional",
    "crm": "número CRM se disponível, null caso contrário",
    "specialty": "especialidade médica/profissional",
    "availability": "disponibilidade se mencionada, null caso contrário"
  }
]

Extraia TODOS os profissionais encontrados no documento. Se houver tabelas, leia todas as linhas.`;

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
                text: "Extraia todos os profissionais de saúde deste documento PDF."
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
      throw new Error(`Erro na extração via IA (${status})`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let professionals: any[];
    try {
      const cleaned = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      professionals = JSON.parse(cleaned);
      if (!Array.isArray(professionals)) {
        professionals = [professionals];
      }
    } catch {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      throw new Error("Não foi possível extrair profissionais do documento.");
    }

    console.log("Extracted", professionals.length, "professionals");

    // Batch insert
    const rows = professionals.map((p: any) => ({
      name: p.name || "Sem nome",
      crm: p.crm || null,
      specialty: p.specialty || null,
      availability: p.availability || null,
      source_file: fileName || filePath,
      raw_data: p,
    }));

    const { error: insertError } = await supabase.from("professionals").insert(rows);
    if (insertError) throw new Error(`Insert error: ${insertError.message}`);

    return new Response(JSON.stringify({ success: true, count: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("extract-professionals error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
