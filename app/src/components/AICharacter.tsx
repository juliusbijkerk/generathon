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
      content: `Good morning, ${userName}! 🌅\n\nI've gone through today's tech landscape and pulled ${items.length} things worth your time. The big themes I'm seeing: AI agent infrastructure is moving fast, edge computing is getting accessible, and there's validated pain around job search automation.\n\nWant the quick rundown, or should we dig into something specific?`,
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
    "Give me the quick rundown",
    "What's breaking in AI/tech today?",
    "Connect the dots for me",
    "What should I dive into first?",
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Character Visual - Photo-realistic AI Assistant */}
      <div className="relative w-full rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
        {/* Video-call style interface */}
        <div className="relative aspect-[3/4] max-w-md mx-auto">
          {/* Background ambient gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
          
          {/* AI-generated realistic avatar placeholder */}
          <div className={`relative h-full flex flex-col transition-all duration-500 ${
            mood === "talking" ? "scale-[1.02]" : "scale-100"
          }`}>
            {/* Photo-realistic character area */}
            <div className="flex-1 relative overflow-hidden">
              {/* Placeholder for AI avatar - in production would be actual photo/video */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-700/50 to-slate-900">
                {/* SVG avatar that looks more professional */}
                <svg viewBox="0 0 200 280" className="w-full h-full">
                  {/* Professional avatar silhouette */}
                  <defs>
                    <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: "#3b82f6", stopOpacity: 0.3 }} />
                      <stop offset="100%" style={{ stopColor: "#8b5cf6", stopOpacity: 0.3 }} />
                    </linearGradient>
                  </defs>
                  {/* Head */}
                  <ellipse cx="100" cy="70" rx="35" ry="40" fill="url(#avatarGrad)" opacity="0.8"/>
                  {/* Shoulders/torso */}
                  <path d="M 60 110 Q 60 95, 100 90 Q 140 95, 140 110 L 150 200 L 50 200 Z" fill="url(#avatarGrad)" opacity="0.6"/>
                  {/* Subtle face features */}
                  <circle cx="88" cy="65" r="3" fill="rgba(255,255,255,0.3)"/>
                  <circle cx="112" cy="65" r="3" fill="rgba(255,255,255,0.3)"/>
                  <path d="M 90 80 Q 100 85, 110 80" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              
              {/* Talking indicator overlay */}
              {mood === "talking" && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1 h-3 rounded-full bg-green-400 animate-pulse"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-white/90">Speaking...</span>
                </div>
              )}
              
              {/* Thinking indicator */}
              {mood === "thinking" && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-xs text-white/90">Thinking...</span>
                </div>
              )}
            </div>

            {/* Name plate - video call style */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${loading ? "bg-amber-400 animate-pulse" : "bg-green-400"}`} />
                <div>
                  <p className="text-sm font-semibold text-white">Alex Chen</p>
                  <p className="text-xs text-white/60">Tech Research Assistant</p>
                </div>
              </div>
            </div>

            {/* Time context */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <p className="text-xs text-white/70">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            </div>
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

function generateResponse(userInput: string, items: BriefItemView[], _userName: string): string {
  const input = userInput.toLowerCase();

  // Quick rundown
  if (input.includes("rundown") || input.includes("summary")) {
    const topThree = items.slice(0, 3);
    return `Here's your quick morning brief:\n\n${topThree.map((item, idx) => 
      `**${idx + 1}. ${item.intent}**: ${item.one_line_insight}`
    ).join("\n\n")}\n\n🔥 The common thread: AI infrastructure is heating up fast, especially on the edge computing side. This feels like early cloud computing days.\n\nWant to go deeper on any of these?`;
  }

  // Breaking news / tech today
  if (input.includes("breaking") || input.includes("today") || input.includes("latest")) {
    const newItems = items.filter(i => i.intent === "TOOL" || i.intent === "BUILD");
    return `Here's what's moving fast in tech right now:\n\n🚀 **${newItems[0]?.one_line_insight || items[0].one_line_insight}**\n\nThis dropped recently and the developer community is already building on it. It's getting traction because it solves the API cost problem for agent builders.\n\n💡 The meta-trend: we're seeing infrastructure tools mature FAST. What took months in 2023 now takes hours.\n\nShould we explore how this connects to what you're working on?`;
  }

  // Connect dots
  if (input.includes("connect") || input.includes("dots") || input.includes("pattern")) {
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

    return `Let me connect the dots for you:\n\n${connections
      .map(([tag, positions]) => `🔗 **${tag}**: ${positions.length} items converge here (${positions.map(p => `#${p}`).join(", ")})`)
      .join("\n\n")}\n\n**The synthesis**: AI agents + accessible edge hardware = the next wave of consumer products. We're at the "iPhone moment" for AI-first devices.\n\nThis maps to your interest in job-ai too - agents that run locally are more trustworthy for personal data.\n\nWant to sketch out what you could build in this space?`;
  }

  // Dive in first
  if (input.includes("dive") || input.includes("start") || input.includes("first")) {
    const topItem = items[0];
    return `Start here:\n\n**#${topItem.rank_position}: ${topItem.one_line_insight}**\n\nWhy this one? It's:\n• Immediately actionable (open source, no API keys needed)\n• Solves a pain point you've hit (scraping without paid APIs)\n• Well-timed (agent builders are looking for exactly this)\n\nTechnically, it's a CLI that wraps browser automation for social platforms. The smart part: it returns structured data that Claude/Cursor can actually use.\n\n**Next move**: Try it on your own content → see what patterns emerge → use those insights for job-ai positioning.\n\nWant the GitHub link or should we discuss strategy first?`;
  }

  // Number reference
  const numberMatch = input.match(/\b([1-7])\b/);
  if (numberMatch) {
    const num = parseInt(numberMatch[1]);
    const item = items.find((i) => i.rank_position === num);
    if (item) {
      return `**Deep dive on #${num}**:\n\n${item.one_line_insight}\n\n**Source**: ${item.source_name} (${item.source_type})\n**Category**: ${item.intent}\n**Tags**: ${item.tags.join(", ")}\n\n**Why this matters**: This ties into the larger trend of ${item.tags[0]} becoming more accessible. Three months ago this would've required a team; now one person can ship it over a weekend.\n\n**Your angle**: For job-ai, you could use similar tech to analyze job posting patterns across platforms.\n\nWant to:\n• See related content from previous days?\n• Draft a technical approach?\n• Find who else is building in this space?`;
    }
  }

  return `I'm here to help you make sense of today's tech landscape. Try:\n\n• **"Give me the quick rundown"** - 3-minute brief\n• **"What's breaking today?"** - Latest developments\n• **"Connect the dots"** - See patterns across items\n• **"What should I dive into first?"** - Prioritized recommendation\n\nOr just ask naturally - I've analyzed your ${items.length} saves and understand your focus areas (AI agents, dev tools, startup growth).`;
}
