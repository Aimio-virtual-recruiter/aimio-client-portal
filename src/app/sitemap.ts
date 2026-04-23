import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://hireaimio.com";
  const lastModified = new Date();

  return [
    { url: baseUrl, priority: 1.0, changeFrequency: "weekly", lastModified },
    { url: `${baseUrl}/landing`, priority: 0.95, changeFrequency: "weekly", lastModified },
    { url: `${baseUrl}/landing#services`, priority: 0.9, changeFrequency: "monthly", lastModified },
    { url: `${baseUrl}/landing#pricing`, priority: 0.9, changeFrequency: "monthly", lastModified },
    { url: `${baseUrl}/landing#how`, priority: 0.85, changeFrequency: "monthly", lastModified },
    { url: `${baseUrl}/landing#platform`, priority: 0.85, changeFrequency: "monthly", lastModified },
    { url: `${baseUrl}/landing#book-demo`, priority: 0.9, changeFrequency: "monthly", lastModified },
  ];
}
