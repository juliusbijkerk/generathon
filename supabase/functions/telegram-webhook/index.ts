// Telegram webhook target. Set with:
//   curl -F "url=https://<project-ref>.functions.supabase.co/telegram-webhook" \
//        https://api.telegram.org/bot<TOKEN>/setWebhook
//
// Same ingestAndClassify() path as the paste box - Telegram is a second front
// door onto one pipeline, not a separate one. Always replies fast (Telegram
// expects a quick 200) and sends a confirmation message back to the chat so
// the phone itself becomes part of the live demo: share a link, watch the bot
// reply with the tag it was given.

import { handleOptions, json } from "../_shared/cors.ts";
import { ingestAndClassify } from "../_shared/ingest.ts";

const PROFILE_SLUG = Deno.env.get("DEFAULT_PROFILE_SLUG") ?? "julius";

function extractUrl(text: string): string | undefined {
  const match = /https?:\/\/\S+/.exec(text);
  return match?.[0];
}

async function sendTelegramMessage(chatId: number, text: string) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN not set, cannot reply");
    return;
  }
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch((err) => console.error("Telegram reply failed", err));
}

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ ok: true });

  const update = await req.json().catch(() => null);
  const message = update?.message;
  const chatId = message?.chat?.id;
  const text: string | undefined = message?.text;

  // Always ack Telegram immediately-ish; errors are reported back into the
  // chat itself rather than surfaced as a webhook failure Telegram would retry.
  if (!chatId || !text) {
    return json({ ok: true });
  }

  // Bot commands (/start, /help, ...) aren't content - don't waste a save row
  // or an LLM call classifying them, just greet the user.
  if (text.trim().startsWith("/")) {
    await sendTelegramMessage(
      chatId,
      "FOC Brief is listening. Share or forward a post here (Instagram/LinkedIn share sheet, or paste a link/text) and I'll tag it for today's brief.\n\nTip: Instagram/LinkedIn often block reading the page directly, so if you share via the share sheet, add a short caption alongside the link so I know what it's about.",
    );
    return json({ ok: true });
  }

  const url = extractUrl(text);
  const fromUsername: string | undefined = message?.from?.username;

  try {
    const { classification } = await ingestAndClassify({
      profile_slug: PROFILE_SLUG,
      source_type: "telegram_forward",
      source_url: url,
      source_name: fromUsername ? `@${fromUsername}` : "telegram",
      raw_text: text,
    });

    const label = classification.is_noise ? "NOISE (skipped)" : classification.intent;
    await sendTelegramMessage(
      chatId,
      `Tagged: ${label}\n${classification.one_line_insight}`,
    );
  } catch (err) {
    console.error("telegram ingest failed", err);
    await sendTelegramMessage(chatId, `Couldn't process that one: ${String(err instanceof Error ? err.message : err)}`);
  }

  return json({ ok: true });
});
