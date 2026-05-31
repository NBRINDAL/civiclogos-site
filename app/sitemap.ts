import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://civiclogos.com";

const publicRoutes = [
  "/",
  "/about",
  "/demo",
  "/challenge",
  "/press",
  "/investors",
  "/ledger",
  "/institutions",
  "/healthcare",
  "/healthcare/topic-001",
  "/healthcare/proposal-001",
  "/rooms",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicRoutes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route === "/ledger" ? 0.85 : 0.8,
  }));
}
