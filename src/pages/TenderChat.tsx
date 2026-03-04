import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Bot, User, Sparkles, MessageSquare, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Tender } from "@/lib/tender-types";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string; timestamp?: number };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-tender`;

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted-foreground/10"
      aria-label="Copiar mensagem"
      title="Copiar"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
    </button>
  );
};

const TypingIndicator = () => (
  <div className="flex gap-3 animate-fade-in" role="status" aria-label="IA digitando">
    <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
      <Bot className="h-4 w-4 text-primary" />
    </div>
    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  </div>
);

const TenderChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tender, setTender] = useState<Tender | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.from("tenders").select("*").eq("id", id!).single().then(({ data }) => {
      setTender(data as unknown as Tender);
    });
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    const userMsg: Msg = { role: "user", content: msg, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ tenderId: id, messages: newMessages }),
      });

      if (!resp.ok) {
        if (resp.status === 429) { toast.error("Limite de requisições excedido. Tente novamente em instantes."); return; }
        if (resp.status === 402) { toast.error("Créditos de IA esgotados."); return; }
        const err = await resp.json();
        throw new Error(err.error || "Erro na IA");
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages([...newMessages, { role: "assistant", content: assistantContent, timestamp: Date.now() }]);
            }
          } catch {}
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar mensagem");
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  }, [input, isLoading, messages, id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestions = [
    { icon: "🎯", text: "Quais os principais riscos?" },
    { icon: "📋", text: "Resuma os requisitos de habilitação" },
    { icon: "🏆", text: "Estratégia para participar" },
    { icon: "📄", text: "Documentos necessários" },
    { icon: "🔍", text: "Quantos atestados são exigidos?" },
    { icon: "💰", text: "Análise financeira do edital" },
  ];

  const insights = tender?.ai_insights as Record<string, any> | null;
  const score = insights?.score ?? null;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3 px-1">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/tender/${id}`)} aria-label="Voltar ao edital">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-base font-bold truncate flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary shrink-0" />
              Chat IA
            </h1>
            <p className="text-xs text-muted-foreground truncate">{tender?.title || "Carregando..."}</p>
          </div>
          {score !== null && (
            <div className={`text-xs font-bold px-2 py-1 rounded-full ${score >= 70 ? "bg-success/10 text-success" : score >= 40 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>
              Score {score}
            </div>
          )}
        </div>

        {/* Chat area */}
        <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-sm">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-label="Mensagens do chat" aria-live="polite">
            {/* Empty state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-5 animate-fade-in px-4">
                <div className="relative">
                  <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-5">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-success animate-pulse" />
                </div>
                <div>
                  <p className="font-display font-bold text-lg">Pergunte sobre o edital</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    A IA tem acesso completo ao edital analisado. Faça perguntas específicas para respostas melhores.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 w-full max-w-lg">
                  {suggestions.map((s) => (
                    <button
                      key={s.text}
                      onClick={() => sendMessage(s.text)}
                      className="flex items-center gap-2.5 text-left rounded-xl border border-border/60 bg-card hover:bg-accent hover:border-primary/30 transition-all px-3 py-2.5 text-sm group"
                    >
                      <span className="text-base">{s.icon}</span>
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 group animate-fade-in ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted rounded-tl-sm"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&>p:last-child]:mb-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  {/* Copy button */}
                  <div className="absolute -bottom-5 right-1">
                    <CopyButton text={msg.content} />
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && <TypingIndicator />}

            <div ref={bottomRef} />
          </CardContent>

          {/* Input area */}
          <div className="border-t border-border p-3 bg-card/50">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="flex items-end gap-2"
            >
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte sobre o edital... (Enter para enviar, Shift+Enter para quebra de linha)"
                disabled={isLoading}
                className="flex-1 min-h-[44px] max-h-[120px] resize-none text-sm"
                rows={1}
                aria-label="Mensagem para a IA"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="shrink-0 h-[44px] w-[44px] rounded-xl"
                aria-label="Enviar mensagem"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              A IA pode cometer erros. Verifique informações importantes.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TenderChat;
