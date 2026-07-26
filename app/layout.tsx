import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { contentServices } from "./composition/content";
import { DeploymentRecovery } from "./components/deployment-recovery";
import type { SiteTheme, ThemeTokens } from "./domain/content";
import "katex/dist/katex.min.css";
import "./globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });
const initializeTheme = `try{const s=localStorage.getItem("site-theme");const t=s==="light"||s==="dark"?s:(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.dataset.theme=t;const m=document.querySelector('meta[name="theme-color"]');if(m)m.content=t==="light"?m.dataset.light:m.dataset.dark}catch{document.documentElement.dataset.theme="dark"}`;

const tokenNames: Record<keyof ThemeTokens, string> = {
  bg: "bg",
  surface: "surface",
  surfaceStrong: "surface-strong",
  text: "text",
  textStrong: "text-strong",
  muted: "muted",
  faint: "faint",
  line: "line",
  lineStrong: "line-strong",
  accent: "accent",
  accentInk: "accent-ink",
  danger: "danger",
  onImage: "on-image",
  onImageMuted: "on-image-muted",
  imageOverlay: "image-overlay",
};

function safeColor(value: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`Invalid theme color: ${value}`);
  return value;
}

function themeCss(theme: SiteTheme): string {
  const declarations = (tokens: ThemeTokens) => Object.entries(tokenNames)
    .map(([key, cssName]) => `--${cssName}:${safeColor(tokens[key as keyof ThemeTokens])}`)
    .join(";");
  return `:root,:root[data-theme="dark"]{${declarations(theme.dark)};color-scheme:dark}:root[data-theme="light"]{${declarations(theme.light)};color-scheme:light}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const { identity } = await contentServices.site.getProfile();
  return {
    metadataBase: new URL(identity.url),
    title: {
      default: `${identity.author} · 开发者、学习者、创作者`,
      template: `%s · ${identity.author}`,
    },
    description: identity.description,
    other: { "codex-preview": "development" },
    icons: { icon: "/favicon.ico", shortcut: "/favicon.ico" },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await contentServices.site.getProfile();
  return (
    <html lang={profile.identity.locale} suppressHydrationWarning>
      <head>
        <meta
          name="theme-color"
          content={profile.theme.dark.bg}
          data-dark={profile.theme.dark.bg}
          data-light={profile.theme.light.bg}
        />
        <style dangerouslySetInnerHTML={{ __html: themeCss(profile.theme) }} />
        <script dangerouslySetInnerHTML={{ __html: initializeTheme }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <DeploymentRecovery />
        {children}
      </body>
    </html>
  );
}
