import { getDomains } from "./metadata/load-metadata";
import { getTransformDomains } from "./metadata/transform-metadata";

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "domain" | "table" | "transform-domain" | "task";
  category: "Load" | "Transform";
  breadcrumb: string;
}


export function buildSearchIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  const loadDomains = getDomains();
  loadDomains.forEach((domain) => {
    results.push({
      id: `load-domain-${domain.name}`,
      title: domain.name,
      description: `Load domain with ${domain.tables.length} table${domain.tables.length !== 1 ? "s" : ""}`,
      url: `/load/${domain.name}`,
      type: "domain",
      category: "Load",
      breadcrumb: `Load / ${domain.name}`,
    });

    domain.tables.forEach((table) => {
      results.push({
        id: `load-table-${domain.name}-${table.name}`,
        title: table.name,
        description: `Table in ${domain.name} domain`,
        url: `/load/${domain.name}/${table.name}`,
        type: "table",
        category: "Load",
        breadcrumb: `Load / ${domain.name} / ${table.name}`,
      });
    });
  });

  const transformDomains = getTransformDomains();
  transformDomains.forEach((domain) => {
    results.push({
      id: `transform-domain-${domain.name}`,
      title: domain.name,
      description: `Transform domain with ${domain.tasks.length} task${domain.tasks.length !== 1 ? "s" : ""}`,
      url: `/transform/${domain.name}`,
      type: "transform-domain",
      category: "Transform",
      breadcrumb: `Transform / ${domain.name}`,
    });

    domain.tasks.forEach((task) => {
      results.push({
        id: `transform-task-${domain.name}-${task.name}`,
        title: task.name,
        description: `Task in ${domain.name} domain`,
        url: `/transform/${domain.name}/${task.name}`,
        type: "task",
        category: "Transform",
        breadcrumb: `Transform / ${domain.name} / ${task.name}`,
      });
    });
  });

  return results;
}

export function searchIndex(query: string, index: SearchResult[]): SearchResult[] {
  if (!query.trim()) {
    return [];
  }

  const lowerQuery = query.toLowerCase().trim();
  const queryWords = lowerQuery.split(/\s+/);

  const scored = index
    .map((item) => {
      const titleLower = item.title.toLowerCase();
      const descriptionLower = item.description.toLowerCase();
      const breadcrumbLower = item.breadcrumb.toLowerCase();
      
      let score = 0;

      if (titleLower === lowerQuery) {
        score += 1000;
      }
      else if (titleLower.startsWith(lowerQuery)) {
        score += 500;
      }
      else if (titleLower.includes(lowerQuery)) {
        score += 250;
      }

      queryWords.forEach((word) => {
        if (titleLower.includes(word)) {
          score += 100;
        }
        if (descriptionLower.includes(word)) {
          score += 50;
        }
        if (breadcrumbLower.includes(word)) {
          score += 25;
        }
      });

      if (score > 0 && (item.type === "domain" || item.type === "transform-domain")) {
        score += 50;
      }

      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);

  return scored.slice(0, 10);
}
