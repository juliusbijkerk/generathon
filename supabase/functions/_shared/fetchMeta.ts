// Best-effort metadata fetch for a saved URL. One polite fetch, short
// timeout, real-browser UA, no retries. A failed fetch must never become a
// hard error in the ingest path - it just falls back to whatever text the
// user typed alongside the link.
//
// Instagram/LinkedIn serve a real page (with the full caption in og:title)
// to a normal mobile-browser User-Agent, but redirect to a login wall for a
// UA that looks like a bot - so pretending to be Safari on iOS, rather than
// announcing ourselves, is what actually gets the caption for a plain share.
// This is what makes single-tap sharing work without typing a caption.

const BROWSER_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

// Titles a blocked/private/deleted page falls back to - real posts never
// render exactly this as their og:title, so treat it as "nothing useful".
const GENERIC_TITLES = new Set(["instagram", "linkedin", "log in to linkedin", "linkedin login"]);

export interface FetchedMeta {
  title: string | null;
  description: string | null;
  status: "ok" | "blocked" | "failed" | "skipped";
}

export async function fetchMeta(url: string | undefined): Promise<FetchedMeta> {
  if (!url) return { title: null, description: null, status: "skipped" };

  try {
    new URL(url);
  } catch {
    return { title: null, description: null, status: "failed" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": BROWSER_UA, accept: "text/html" },
    });
    if (!res.ok) return { title: null, description: null, status: "failed" };
    const html = await res.text();

    const title = extractMeta(html, "og:title") ?? extractTitleTag(html);
    const description = extractMeta(html, "og:description") ?? extractMeta(html, "description");

    if (!title || GENERIC_TITLES.has(title.trim().toLowerCase())) {
      // Got a page, but not the real one (login wall, private post, deleted) -
      // same as an outright block from the caller's point of view.
      return { title: null, description: null, status: "blocked" };
    }

    return { title, description, status: "ok" };
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
