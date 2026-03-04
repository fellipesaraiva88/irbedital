import { Tender } from "./tender-types";
import { CATEGORY_LABELS, STATUS_LABELS } from "./tender-types";

export function exportTenderPDF(tender: Tender) {
  const insights = tender.ai_insights as Record<string, any> | null;

  const lines: string[] = [];
  lines.push(`RELATÓRIO DE ANÁLISE — ${tender.title}`);
  lines.push("=".repeat(60));
  lines.push("");

  lines.push("INFORMAÇÕES GERAIS");
  lines.push("-".repeat(40));
  if (tender.organization) lines.push(`Órgão: ${tender.organization}`);
  if (tender.category) lines.push(`Categoria: ${CATEGORY_LABELS[tender.category]}`);
  if (tender.location) lines.push(`Local: ${tender.location}`);
  if (tender.value_estimate) lines.push(`Valor Estimado: R$ ${Number(tender.value_estimate).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  if (tender.deadline) lines.push(`Prazo: ${new Date(tender.deadline).toLocaleDateString("pt-BR")}`);
  if (tender.status) lines.push(`Status: ${STATUS_LABELS[tender.status]}`);
  lines.push("");

  if (tender.description) {
    lines.push("DESCRIÇÃO");
    lines.push("-".repeat(40));
    lines.push(tender.description);
    lines.push("");
  }

  if (tender.ai_summary) {
    lines.push("RESUMO EXECUTIVO (IA)");
    lines.push("-".repeat(40));
    lines.push(tender.ai_summary);
    lines.push("");
  }

  if (tender.requirements?.length) {
    lines.push("REQUISITOS PARA PARTICIPAÇÃO");
    lines.push("-".repeat(40));
    tender.requirements.forEach((r, i) => lines.push(`${i + 1}. ${r}`));
    lines.push("");
  }

  if (insights?.risks) {
    lines.push("⚠ RISCOS IDENTIFICADOS");
    lines.push("-".repeat(40));
    lines.push(insights.risks);
    lines.push("");
  }

  if (insights?.opportunities) {
    lines.push("✓ OPORTUNIDADES");
    lines.push("-".repeat(40));
    lines.push(insights.opportunities);
    lines.push("");
  }

  if (insights?.recommendations) {
    lines.push("→ RECOMENDAÇÕES");
    lines.push("-".repeat(40));
    lines.push(insights.recommendations);
    lines.push("");
  }

  if (insights?.compliance_checklist?.length) {
    lines.push("CHECKLIST DE CONFORMIDADE");
    lines.push("-".repeat(40));
    insights.compliance_checklist.forEach((item: string, i: number) => lines.push(`[ ] ${i + 1}. ${item}`));
    lines.push("");
  }

  if (insights?.key_dates?.length) {
    lines.push("DATAS IMPORTANTES");
    lines.push("-".repeat(40));
    insights.key_dates.forEach((d: any) => lines.push(`${d.date || "—"}: ${d.description}`));
    lines.push("");
  }

  const contactInfo = tender.contact_info as Record<string, any> | null;
  if (contactInfo && Object.values(contactInfo).some(v => v)) {
    lines.push("CONTATO");
    lines.push("-".repeat(40));
    if (contactInfo.responsible) lines.push(`Responsável: ${contactInfo.responsible}`);
    if (contactInfo.email) lines.push(`Email: ${contactInfo.email}`);
    if (contactInfo.phone) lines.push(`Telefone: ${contactInfo.phone}`);
    if (contactInfo.address) lines.push(`Endereço: ${contactInfo.address}`);
    lines.push("");
  }

  lines.push("=".repeat(60));
  lines.push(`Gerado por LicitaAI em ${new Date().toLocaleString("pt-BR")}`);

  const content = lines.join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `analise-${tender.title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
