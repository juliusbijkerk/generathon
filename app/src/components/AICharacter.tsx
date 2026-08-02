import { useState, useRef, useEffect } from "react";
import type { BriefItemView } from "../lib/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AICharacterProps {
  items: BriefItemView[];
  userName: string;
}

type CharacterMood = "idle" | "talking" | "thinking" | "excited";

export function AICharacter({ items, userName }: AICharacterProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hey ${userName}! I'm Alex, your content co-pilot. I've analyzed your ${items.length} saves from today. What catches your eye?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState<CharacterMood>("idle");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Animate character mood
    if (loading) {
      setMood("thinking");
    } else if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      setMood("talking");
      setTimeout(() => setMood("idle"), 2000);
    }
  }, [loading, messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const response = generateResponse(userMessage, items, userName);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setLoading(false);
    }, 1500);
  }

  const quickPrompts = [
    "What's most important?",
    "Show me connections",
    "Help me build something",
    "Tell me about #1",
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Character Visual */}
      <div className="relative aspect-square max-w-md mx-auto w-full rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-blue-500/10 to-purple-500/10 overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.15),transparent_70%)]" />
        
        {/* Character Avatar */}
        <div className="relative h-full flex flex-col items-center justify-center p-8">
          {/* Avatar circle with mood */}
          <div className={`relative transition-all duration-500 ${
            mood === "talking" ? "scale-105" : mood === "thinking" ? "scale-95 opacity-80" : "scale-100"
          }`}>
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center relative overflow-hidden">
              {/* Face emoji - could be replaced with actual avatar */}
              <div className="text-7xl">
                {mood === "thinking" ? "🤔" : mood === "excited" ? "🚀" : mood === "talking" ? "😊" : "👋"}
              </div>
              
              {/* Talking animation */}
              {mood === "talking" && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Pulse effect when talking */}
            {mood === "talking" && (
              <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping" />
            )}
          </div>

          {/* Character name & role */}
          <div className="mt-6 text-center">
            <h3 className="text-xl font-bold text-white">Alex</h3>
            <p className="text-sm text-white/60">Your Content Co-Founder</p>
          </div>

          {/* Status indicator */}
          <div className="mt-4 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              loading ? "bg-yellow-400 animate-pulse" : "bg-green-400"
            }`} />
            <span className="text-xs text-white/50">
              {loading ? "Thinking..." : "Ready to chat"}
            </span>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex flex-col rounded-[28px] border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[400px]">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-blue-500/20 text-blue-100"
                    : "bg-white/[0.08] text-white/90"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">👤</span>
                    <span className="text-xs font-semibold text-white/60">Alex</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white/[0.08] px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-white/40 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-white/50">Alex is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts */}
        <div className="border-t border-white/[0.08] px-5 py-3">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInput(prompt)}
                className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.1] transition"
              >
                {prompt}
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
              placeholder="Talk to Alex about your content..."
              className="flex-1 rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white/90 placeholder:text-white/30 focus:border-blue-400/30 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function generateResponse(userInput: string, items: BriefItemView[], userName: string): string {
  const input = userInput.toLowerCase();

  if (input.includes("important") || input.includes("focus")) {
    const topItem = items[0];
    return `Based on your profile, I'd start with #${topItem.rank_position}:\n\n"${topItem.one_line_insight}"\n\nThis hits your sweet spot: ${topItem.tags.slice(0, 2).join(" + ")}. It's actionable today and aligns with what you care about. Want me to break down why this matters?`;
  }

  if (input.includes("connect") || input.includes("relation")) {
    const tagGroups = new Map<string, number[]>();
    items.forEach((item) => {
      item.tags.forEach((tag) => {
        if (!tagGroups.has(tag)) tagGroups.set(tag, []);
        tagGroups.get(tag)!.push(item.rank_position);
      });
    });
    
    const connections = Array.from(tagGroups.entries())
      .filter(([_, positions]) => positions.length > 1)
      .slice(0, 2);

    return `I see some strong patterns, ${userName}:\n\n${connections
      .map(([tag, positions]) => `🔗 **${tag}**: Items ${positions.join(", ")} all connect here`)
      .join("\n")}\n\nThe ai-agents + dev-tools combo is especially hot right now. These could be puzzle pieces for something you build. Want to explore one of these threads?`;
  }

  if (input.includes("build") || input.includes("make")) {
    return `Let's build! 🚀\n\nI see ${items.filter((i) => i.intent === "BUILD" || i.intent === "TOOL").length} actionable pieces here. The clearest path I see:\n\n1. Start with the agent infrastructure (items tagged ai-agents)\n2. Combine with the edge AI angle (super accessible now)\n3. Target the job market pain point (validated by high engagement)\n\nWant me to sketch out a quick prototype plan? Or should we look at what others have built in this space?`;
  }

  const numberMatch = input.match(/\b([1-7])\b/);
  if (numberMatch) {
    const num = parseInt(numberMatch[1]);
    const item = items.find((i) => i.rank_position === num);
    if (item) {
      return `**Item #${num}** (${item.intent}):\n\n"${item.one_line_insight}"\n\nFrom: ${item.source_name}\nTags: ${item.tags.join(", ")}\n\n🤔 This is interesting because it connects to ${item.tags[0]}. I can help you:\n• Find similar ideas\n• Draft a post about it\n• See who else is working on this\n\nWhat sounds useful?`;
    }
  }

  return `Good question! Here's how I can help:\n\n💡 **"What's most important?"** - I'll tell you what to focus on first\n🔗 **"Show connections"** - I'll map how these ideas relate\n🔨 **"Help me build"** - I'll sketch out next steps\n📍 **"Tell me about #1"** - I'll dive deep on any item\n\nOr just chat naturally - I understand your ${items.length} saves and how they fit your interests!`;
}
