import { MetadataRoute } from 'next';
import { getDomains } from '@/lib/tpch/load-metadata';
import { getTransformDomains } from '@/lib/tpch/transform-metadata';

const BASE_URL = 'https://starlake.ai';

export default function sitemap(): MetadataRoute.Sitemap {
  const loadDomains = getDomains();
  const transformDomains = getTransformDomains();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/load`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/transform`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
  ];

  const loadRoutes: MetadataRoute.Sitemap = loadDomains.flatMap((domain) => [
    {
      url: `${BASE_URL}/load/${domain.name}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    ...domain.tables.map((table) => ({
      url: `${BASE_URL}/load/${domain.name}/${table.name}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ]);

  const transformRoutes: MetadataRoute.Sitemap = transformDomains.flatMap((domain) => [
    {
      url: `${BASE_URL}/transform/${domain.name}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    ...domain.tasks.map((task) => ({
      url: `${BASE_URL}/transform/${domain.name}/${task.name}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ]);

  return [...staticRoutes, ...loadRoutes, ...transformRoutes];
}
