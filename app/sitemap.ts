import type { MetadataRoute } from "next";

import { appConfig } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/charities", "/how-it-works", "/login", "/signup"].map((route) => ({
    url: `${appConfig.appUrl}${route}`,
    lastModified: new Date(),
  }));
}

