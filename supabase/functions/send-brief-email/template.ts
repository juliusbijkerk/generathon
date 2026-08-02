// HTML email renderer for a brief. Deliberately plain inline-styled HTML
// (no build step, no external CSS) since that is what survives real inboxes.

export interface EmailBriefItem {
  rank_position: number;
  intent: string;
  tags: string[];
  one_line_insight: string;
  source_url: string | null;
  source_name: string | null;
  source_type: string;
}

export interface EmailBriefData {
  displayName: string;
  briefDate: string;
  videoUrl: string | null;
  webUrl: string;
  skippedCount: number;
  items: EmailBriefItem[];
}

const INTENT_COLOR: Record<string, string> = {
  TOOL: "#2563eb",
  BUILD: "#16a34a",
  MARKET: "#d97706",
  ANCHOR: "#7c3aed",
  DISCOVER: "#0891b2",
};

function tagPill(intent: string): string {
  const color = INTENT_COLOR[intent] ?? "#6b7280";
  return `<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:${color};color:#fff;font-size:11px;font-weight:600;letter-spacing:0.02em">${intent}</span>`;
}

function itemRow(item: EmailBriefItem): string {
  const link = item.source_url
    ? `<a href="${item.source_url}" style="color:#111827;text-decoration:none">${item.one_line_insight}</a>`
    : item.one_line_insight;
  return `
  <tr>
    <td style="padding:14px 0;border-bottom:1px solid #e5e7eb">
      <div style="margin-bottom:6px">${tagPill(item.intent)} <span style="color:#9ca3af;font-size:12px;margin-left:6px">${item.source_name ?? item.source_type}</span></div>
      <div style="font-size:15px;line-height:1.5;color:#111827">${link}</div>
    </td>
  </tr>`;
}

export function renderBriefEmail(data: EmailBriefData): string {
  const rows = data.items.map(itemRow).join("\n");
  const videoBlock = data.videoUrl
    ? `<a href="${data.webUrl}" style="display:block;text-align:center;background:#111827;color:#fff;padding:16px;border-radius:12px;text-decoration:none;font-weight:600;margin-bottom:24px">Watch today's brief (${data.items.length} items)</a>`
    : `<a href="${data.webUrl}" style="display:block;text-align:center;background:#111827;color:#fff;padding:16px;border-radius:12px;text-decoration:none;font-weight:600;margin-bottom:24px">Open today's brief</a>`;

  const skippedLine =
    data.skippedCount > 0
      ? `<p style="color:#9ca3af;font-size:12px;margin-top:16px">Skipped ${data.skippedCount} noise item${data.skippedCount === 1 ? "" : "s"} - engagement bait and unlinked vents never made it here.</p>`
      : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 0">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;padding:32px">
            <tr>
              <td>
                <p style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;margin:0 0 4px">${data.briefDate}</p>
                <h1 style="font-size:22px;margin:0 0 20px;color:#111827">${data.displayName}'s brief</h1>
                ${videoBlock}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${rows}
                </table>
                ${skippedLine}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
