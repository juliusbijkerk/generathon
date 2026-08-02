// Best-effort metadata fetch for a saved URL. One polite fetch, short
// timeout, honest UA, no retries. Instagram and LinkedIn routinely block
// unauthenticated server-side fetches (both returned "Page Not Found" /
// login walls when tested during planning for this project), so those hosts
// skip the network call entirely and fall straight back to whatever text the
// user pasted alongside the link - a failed fetch must never become a hard
// error in the ingest path.

const BLOCKED_HOSTS = ["instagram.com", "www.instagram.com", "linkedin.com", "www.linkedin.com"];

export interface FetchedMeta {
  title: string | null;
  description: string | null;
  status: "ok" | "blocked" | "failed" | "skipped";
}

export async function fetchMeta(url: string | undefined): Promise<FetchedMeta> {
  if (!url) return { title: null, description: null, status: "skipped" };

  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    return { title: null, description: null, status: "failed" };
  }

  if (BLOCKED_HOSTS.some((h) => host.endsWith(h))) {
    return { title: null, description: null, status: "blocked" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; FOC-bot/0.1; +https://foc.app/bot)",
      },
    });
    if (!res.ok) return { title: null, description: null, status: "failed" };
    const html = await res.text();
    return {
      title: extractMeta(html, "og:title") ?? extractTitleTag(html),
      description: extractMeta(html, "og:description") ?? extractMeta(html, "description"),
      status: "ok",
    };
  } catch {
    return { title: null, description: null, status: "failed" };
  } finally {
    clearTimeout(timeout);
  }
}

function extractMeta(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`,
    "i",
  );
  const match = re.exec(html);
  return match ? decodeEntities(match[1]) : null;
}

function extractTitleTag(html: string): string | null {
  const match = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  return match ? decodeEntities(match[1]) : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}
