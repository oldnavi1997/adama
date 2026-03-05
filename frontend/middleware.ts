export const config = { matcher: ["/producto/:path*"] };

const BOT_UA =
  /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Googlebot/i;

export default function middleware(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  if (BOT_UA.test(ua)) {
    const url = new URL(request.url);
    const backend = process.env.BACKEND_PUBLIC_URL ?? "";
    return Response.redirect(`${backend}/og${url.pathname}`, 302);
  }
}
