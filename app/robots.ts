import type { MetadataRoute } from "next";
import { contentServices } from "./composition/content";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const profile = await contentServices.site.getProfile();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/studio", "/api/studio"],
    },
    sitemap: `${profile.identity.url}/sitemap.xml`,
  };
}
