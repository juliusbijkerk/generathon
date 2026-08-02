import { useState, useRef, useEffect } from "react";
import type { BriefItemView } from "../lib/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatProps {
  items: BriefItemView[];
  userName: string;
}

export function AIChat({ items, userName }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hey ${userName}! I've gone through your ${items.length} saves. Ask me anything - "tell me more about X", "how do these connect?", "help me build on this idea", or just pick a number to explore deeper. 🚀`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    // Simulate AI response with context from items
    // In production, this would call OpenAI/Claude with RAG
    setTimeout(() => {
      const response = generateResponse(userMessage, items);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setLoading(false);
    }, 1000);
  }

  const quickActions = [
    "💡 Show connections",
    "🔨 Help me build",
    "📊 Summarize trends",
    "🎯 What should I focus on?",
  ];

  return (
    <div className="flex h-[600px] flex-col rounded-[28px] border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-blue-500/20 text-blue-100"
                  : "bg-white/[0.08] text-white/90"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white/[0.08] px-4 py-3">
              <p className="text-sm text-white/60">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      <div className="border-t border-white/[0.08] px-5 py-3">
        <div className="flex flex-wrap gap-2 mb-3">
          {quickActions.map((action) => (
            <button
              key={action}
              onClick={() => setInput(action)}
              className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.1] transition"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.08] p-5">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about your content, explore connections, or get help building..."
            className="flex-1 rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white/90 placeholder:text-white/30 focus:border-white/[0.16] focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function generateResponse(userInput: string, items: BriefItemView[]): string {
  const input = userInput.toLowerCase();

  // Check for item number references
  const numberMatch = input.match(/\b([1-7])\b/);
  if (numberMatch) {
    const num = parseInt(numberMatch[1]);
    const item = items.find((i) => i.rank_position === num);
    if (item) {
      return `**Item #${num}: ${item.intent}**\n\n${item.one_line_insight}\n\n💡 This connects to ${item.tags.join(", ")}. Want to:\n• See similar content?\n• Draft a post about this?\n• Add to your project notes?`;
    }
  }

  // Connection query
  if (input.includes("connect") || input.includes("relate")) {
    const tagGroups = new Map<string, number[]>();
    items.forEach((item) => {
      item.tags.forEach((tag) => {
        if (!tagGroups.has(tag)) tagGroups.set(tag, []);
        tagGroups.get(tag)!.push(item.rank_position);
      });
    });
    
    const connections = Array.from(tagGroups.entries())
      .filter(([_, positions]) => positions.length > 1)
      .slice(0, 3);

    if (connections.length > 0) {
      return `🔗 **Key connections I'm seeing:**\n\n${connections
        .map(([tag, positions]) => `• **${tag}**: Items ${positions.join(", ")} all relate to this`)
        .join("\n")}\n\nThe ai-agents + dev-tools combo is especially strong today. These could be the foundation for something you build.`;
    }
  }

  // Build help
  if (input.includes("build") || input.includes("help me")) {
    return `🔨 **Let's build on this!**\n\nI see ${items.filter((i) => i.intent === "BUILD" || i.intent === "TOOL").length} actionable items. The strongest angles:\n\n• Agent infrastructure is hot right now (items with ai-agents tag)\n• Edge AI hardware is accessible (ESP32 hack)\n• Job market pain is validated (high engagement on those posts)\n\nWhich direction excites you? I can help you:\n• Map out a prototype\n• Find similar successful projects\n• Draft your launch post`;
  }

  // Trend summary
  if (input.includes("trend") || input.includes("summarize")) {
    const intentCounts = items.reduce((acc, item) => {
      acc[item.intent] = (acc[item.intent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return `📊 **Today's signal:**\n\n${Object.entries(intentCounts)
      .map(([intent, count]) => `• ${count}x ${intent}`)
      .join("\n")}\n\nBiggest theme: AI agents + practical dev tools. The market is moving toward accessible edge AI and better agent infrastructure. You're tracking the right stuff.`;
  }

  // Focus recommendation
  if (input.includes("focus") || input.includes("should i")) {
    const topItem = items[0];
    return `🎯 **Start with #${topItem.rank_position}:**\n\n${topItem.one_line_insight}\n\nWhy? It's tagged ${topItem.tags.join(" + ")}, which aligns perfectly with your interests. Plus it's actionable TODAY.\n\nNext: Check out the ${items[1].intent.toLowerCase()} item at #${items[1].rank_position} - it complements this nicely.`;
  }

  // Default response
  return `I can help you explore these ${items.length} items! Try:\n• "Tell me about item #1"\n• "Show me connections between these"\n• "What's the biggest trend here?"\n• "Help me build on this"\n\nOr just pick a number 1-${items.length} to dive deeper!`;
}
