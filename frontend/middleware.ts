declare const process: { env: Record<string, string | undefined> };

export const config = { matcher: ["/producto/:path*"] };

const BOT_UA =
  /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Googlebot/i;

export default async function middleware(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!BOT_UA.test(ua)) return;

  const url = new URL(request.url);
  const backend = process.env.BACKEND_PUBLIC_URL ?? "";
  const ogUrl = `${backend}/og${url.pathname}`;

  try {
    const upstream = await fetch(ogUrl, { headers: { "user-agent": ua } });
    const html = await upstream.text();
    return new Response(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" }
    });
  } catch {
    // si el backend no responde, deja pasar al SPA
  }
}
