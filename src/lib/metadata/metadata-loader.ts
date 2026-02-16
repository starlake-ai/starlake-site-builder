import { existsSync, readFileSync, readdirSync } from "fs";
import path from "path";

export interface ItemInfo {
  name: string;
  filePath: string;
}

export interface GenericDomainInfo {
  name: string;
  items: ItemInfo[];
}

interface MetadataLoaderConfig {
  dataDir: string;
  indexFileName: string;
  relationsDir: string;
  relationsSuffix: string;
}

function getSiteDir(subDir: string): string | null {
  const base = process.env.SITE_BASE_PATH;
  if (!base) return null;
  return path.join(base, subDir);
}


export function createMetadataLoader(config: MetadataLoaderConfig) {
  const { dataDir, indexFileName, relationsDir, relationsSuffix } = config;

  function getDomains(): GenericDomainInfo[] {
    const dir = getSiteDir(dataDir);
    if (!dir || !existsSync(dir)) {
      if (!process.env.SITE_BASE_PATH) {
        console.warn("SITE_BASE_PATH environment variable is not set");
      } else {
        console.warn(`${dataDir} directory not found: ${dir}`);
      }
      return [];
    }

    const indexPath = path.join(dir, indexFileName);
    if (!existsSync(indexPath)) {
      console.warn(`${indexFileName} not found: ${indexPath}`);
      return [];
    }

    let domainNames: string[] = [];
    try {
      const raw = readFileSync(indexPath, "utf-8");
      const data = JSON.parse(raw);
      const list = Array.isArray(data) ? data : [data];
      domainNames = list
        .map((item: Record<string, unknown>) => item.name)
        .filter((n: unknown): n is string => typeof n === "string");
    } catch (e) {
      console.warn(`Failed to parse ${indexFileName}:`, e);
      return [];
    }

    const files = readdirSync(dir);
    const excludeSet = new Set([indexFileName]);

    return domainNames
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
      .map((domainName) => {
        const prefix = `${domainName}.`;
        const suffix = ".json";
        const itemFiles = files.filter(
          (f) =>
            !excludeSet.has(f) &&
            f.startsWith(prefix) &&
            f.endsWith(suffix) &&
            f.length > prefix.length + suffix.length
        );
        const items: ItemInfo[] = itemFiles
          .map((f) => {
            const baseName = f.slice(0, -suffix.length);
            const itemName = baseName.slice(prefix.length);
            return { name: itemName, filePath: path.join(dir, f) };
          })
          .sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
          );
        return { name: domainName, items };
      });
  }

  function getDomain(domainName: string): GenericDomainInfo | null {
    return getDomains().find((d) => d.name === domainName) ?? null;
  }

  function getItemJson(
    domainName: string,
    itemName: string
  ): Record<string, unknown> | null {
    const domain = getDomain(domainName);
    if (!domain) return null;
    const item = domain.items.find((i) => i.name === itemName);
    if (!item || !existsSync(item.filePath)) return null;
    try {
      return JSON.parse(
        readFileSync(item.filePath, "utf-8")
      ) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  function getRelationsJson(
    domainName: string,
    itemName: string
  ): Record<string, unknown> | null {
    const relDir = getSiteDir(relationsDir);
    if (!relDir || !existsSync(relDir)) return null;

    const filePath = path.join(
      relDir,
      `${domainName}.${itemName}${relationsSuffix}.json`
    );
    if (!existsSync(filePath)) return null;

    try {
      return JSON.parse(
        readFileSync(filePath, "utf-8")
      ) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  return { getDomains, getDomain, getItemJson, getRelationsJson };
}
