import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, X, Send, Bot, User, Sparkles, Zap, TrendingUp, DollarSign, Route as RouteIcon, Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getFallbackResponse } from "@/lib/chatFallback";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const hasBackend = Boolean(import.meta.env.VITE_SUPABASE_URL);

// Context-aware quick actions per module
type QuickAction = { label: string; prompt: string; icon: typeof Zap };

const moduleContext: Record<string, { name: string; greeting: string; actions: QuickAction[] }> = {
  "/": {
    name: "Dashboard",
    greeting: "I can help you plan your FTTP deployment. What would you like to explore?",
    actions: [
      { label: "Project summary", prompt: "Give me a smart project summary and key insights to start planning.", icon: Lightbulb },
      { label: "Cost basics", prompt: "Explain how FTTP cost is calculated in simple terms.", icon: DollarSign },
      { label: "Deployment tips", prompt: "Suggest the best deployment strategy for a typical project.", icon: Zap },
      { label: "ROI insights", prompt: "Share profitability and ROI insights for FTTP projects.", icon: TrendingUp },
    ],
  },
  "/map": {
    name: "Route Planning",
    greeting: "You're in Route Planning. I can suggest better routes and explain distance impact.",
    actions: [
      { label: "Suggest better route", prompt: "Suggest a better route considering distance, terrain and cost.", icon: RouteIcon },
      { label: "Distance impact", prompt: "Explain how route distance impacts cost and labour.", icon: TrendingUp },
      { label: "Aerial vs underground", prompt: "Compare aerial vs underground deployment for this route.", icon: Zap },
      { label: "Reduce labour", prompt: "How can I reduce labour requirements for this route?", icon: Lightbulb },
    ],
  },
  "/analysis": {
    name: "Cost & Scenario Analysis",
    greeting: "You're in Cost Analysis. I can explain why costs look this way and suggest optimizations.",
    actions: [
      { label: "Explain cost", prompt: "Explain the cost breakdown in simple language.", icon: DollarSign },
      { label: "Optimize budget", prompt: "Suggest cost-saving strategies to optimize this budget.", icon: Zap },
      { label: "Reduce labour cost", prompt: "How can I reduce labour cost without delaying the project?", icon: Lightbulb },
      { label: "Profit insights", prompt: "Show profit insights and ROI suggestions.", icon: TrendingUp },
    ],
  },
  "/budget": {
    name: "Budget",
    greeting: "You're in the Budget module. I can help you optimize allocation and identify savings.",
    actions: [
      { label: "Optimize budget", prompt: "Suggest budget optimization tips for this FTTP project.", icon: Zap },
      { label: "Material savings", prompt: "How can material optimization improve profit margin?", icon: DollarSign },
      { label: "Risk analysis", prompt: "Run a quick risk analysis on this budget plan.", icon: Lightbulb },
      { label: "Profitability", prompt: "What can I do to improve profitability and ROI?", icon: TrendingUp },
    ],
  },
};

const defaultCtx = moduleContext["/"];

const AIChatBot = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ctx = useMemo(() => moduleContext[location.pathname] ?? defaultCtx, [location.pathname]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    // Prepend lightweight context so backend & fallback both benefit
    const contextHint: Message = {
      role: "user",
      content: `[Context: user is currently in the ${ctx.name} module of an FTTP telecom planning app. Provide intelligent, telecom-specific recommendations tailored to this module.]`,
    };
    const visibleMessages = [...messages, userMsg];
    const payloadMessages =
      messages.length === 0 ? [contextHint, userMsg] : [...messages, userMsg];

    setMessages(visibleMessages);
    setInput("");
    setIsLoading(true);

    if (hasBackend) {
      let assistantSoFar = "";
      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: payloadMessages }),
        });

        if (!resp.ok || !resp.body) throw new Error("Backend unavailable");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let streamDone = false;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") { streamDone = true; break; }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantSoFar += content;
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant") {
                    return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                  }
                  return [...prev, { role: "assistant", content: assistantSoFar }];
                });
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        if (!assistantSoFar) throw new Error("Empty response");
        setIsLoading(false);
        return;
      } catch (e) {
        console.log("LLM backend unavailable, using fallback:", e);
      }
    }

    // Fallback
    const fallback = getFallbackResponse(text.trim());
    let i = 0;
    const chunkSize = 8;
    const interval = setInterval(() => {
      i += chunkSize;
      const partial = fallback.slice(0, i);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, idx) => idx === prev.length - 1 ? { ...m, content: partial } : m);
        }
        return [...prev, { role: "assistant", content: partial }];
      });
      if (i >= fallback.length) {
        clearInterval(interval);
        setIsLoading(false);
      }
    }, 12);
  };

  return (
    <>
      {/* Floating button — always on top */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className={`fixed bottom-5 right-5 z-[100] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ring-2 ring-white/10 ${
          open
            ? "bg-slate-700 hover:bg-slate-600 scale-90"
            : "bg-gradient-to-br from-primary via-primary to-blue-600 hover:scale-105 animate-pulse-glow"
        }`}
      >
        {open ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <div className="relative">
            <Sparkles className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white/20 animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat panel — glassmorphism, on top of every module */}
      {open && (
        <div
          className="fixed bottom-24 right-5 z-[100] w-[380px] max-w-[calc(100vw-2.5rem)] max-h-[560px] flex flex-col rounded-2xl border border-white/10 shadow-2xl animate-fade-in overflow-hidden backdrop-blur-xl"
          style={{
            background:
              "linear-gradient(155deg, rgba(15,23,42,0.96) 0%, rgba(15,23,42,0.92) 50%, rgba(30,41,59,0.95) 100%)",
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 bg-gradient-to-r from-primary/20 to-transparent">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles className="w-4.5 h-4.5 text-white" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">FTTP AI Assistant</p>
              <p className="text-[10px] text-slate-300/80 truncate">
                <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 align-middle" />
                Online · {ctx.name}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[340px] scrollbar-thin">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex gap-2 items-start">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/30 to-blue-500/20 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="text-xs text-slate-200 leading-relaxed">
                    <p className="font-medium text-white mb-1">👋 Hi! I'm your telecom planning assistant.</p>
                    <p className="text-slate-300/90">{ctx.greeting}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pl-9">
                  {ctx.actions.map((a) => {
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.label}
                        onClick={() => sendMessage(a.prompt)}
                        className="group text-left text-[11px] text-slate-100 bg-white/5 hover:bg-white/10 rounded-lg px-2.5 py-2 transition-all border border-white/10 hover:border-primary/40 flex items-center gap-1.5"
                      >
                        <Icon className="w-3 h-3 text-primary group-hover:scale-110 transition-transform shrink-0" />
                        <span className="truncate">{a.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                  msg.role === "user"
                    ? "bg-blue-500/20 border-blue-400/30"
                    : "bg-gradient-to-br from-primary/30 to-blue-500/20 border-white/10"
                }`}>
                  {msg.role === "user"
                    ? <User className="w-3.5 h-3.5 text-blue-300" />
                    : <Bot className="w-3.5 h-3.5 text-primary" />}
                </div>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-white"
                    : "bg-white/5 text-slate-100 border border-white/5"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-xs prose-invert max-w-none [&_p]:m-0 [&_ul]:my-1 [&_li]:my-0 [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_code]:text-[10px] [&_code]:bg-white/10 [&_code]:px-1 [&_code]:rounded [&_strong]:text-white [&_table]:text-[10px] [&_th]:px-2 [&_td]:px-2">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : msg.content}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/30 to-blue-500/20 border border-white/10 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2.5">
                  <div className="flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="text-[10px] text-slate-400 ml-1.5">Thinking…</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Context-aware quick actions after first messages */}
          {messages.length > 0 && !isLoading && (
            <div className="px-3 pb-2 flex flex-wrap gap-1 border-t border-white/5 pt-2">
              {ctx.actions.slice(0, 3).map((a) => (
                <button
                  key={a.label}
                  onClick={() => sendMessage(a.prompt)}
                  className="text-[10px] text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-2.5 py-1 border border-primary/20 transition-colors"
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="p-3 border-t border-white/10 flex gap-2 bg-slate-950/30"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${ctx.name.toLowerCase()}…`}
              disabled={isLoading}
              className="flex-1 text-sm bg-white/5 text-white placeholder:text-slate-400 rounded-lg px-3 py-2 border border-white/10 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-40 disabled:hover:scale-100 shadow-lg shadow-primary/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatBot;
