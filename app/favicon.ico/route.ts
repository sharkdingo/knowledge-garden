import { contentServices } from "../composition/content";

export async function GET() {
  const profile = await contentServices.site.getProfile();
  const theme = profile.theme.dark;
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="14" fill="${theme.bg}"/>
    <circle cx="32" cy="32" r="19" fill="none" stroke="${theme.accent}" stroke-width="3"/>
    <circle cx="32" cy="13" r="3" fill="${theme.accent}"/>
    <path d="M21 34h22M32 23v22" stroke="${theme.textStrong}" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
  return new Response(icon, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
