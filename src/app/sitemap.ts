import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://hireaimio.com";
  const lastModified = new Date();

  // Only unique URLs (no #fragments — Google rejects those)
  return [
    {
      url: baseUrl,
      priority: 1.0,
      changeFrequency: "weekly",
      lastModified,
    },
    {
      url: `${baseUrl}/landing`,
      priority: 0.7,
      changeFrequency: "weekly",
      lastModified,
    },
    {
      url: `${baseUrl}/login`,
      priority: 0.5,
      changeFrequency: "monthly",
      lastModified,
    },
  ];
}
