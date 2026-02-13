import { existsSync, readFileSync, readdirSync } from "fs";
import path from "path";

function getTablesDir(): string | null {
  const base = process.env.SITE_BASE_PATH;
  if (!base) return null;
  return path.join(base, "tables");
}

function getTableRelationsDir(): string | null {
  const base = process.env.SITE_BASE_PATH;
  if (!base) return null;
  return path.join(base, "table-relations");
}

export interface TableInfo {
  name: string;
  filePath: string;
}

export interface DomainInfo {
  name: string;
  tables: TableInfo[];
}

interface DomainsJsonItem {
  name?: string;
  [key: string]: unknown;
}

export function getDomains(): DomainInfo[] {
  const tablesDir = getTablesDir();
  if (!tablesDir || !existsSync(tablesDir)) {
    if (!process.env.SITE_BASE_PATH) {
      console.warn("SITE_BASE_PATH environment variable is not set");
    } else {
      console.warn(`Tables directory not found: ${tablesDir}`);
    }
    return [];
  }

  const domainsPath = path.join(tablesDir, "domains.json");
  if (!existsSync(domainsPath)) {
    console.warn(`domains.json not found: ${domainsPath}`);
    return [];
  }

  let domainNames: string[] = [];
  try {
    const raw = readFileSync(domainsPath, "utf-8");
    const data = JSON.parse(raw) as DomainsJsonItem[] | DomainsJsonItem;
    const list = Array.isArray(data) ? data : [data];
    domainNames = list
      .map((item) => item.name)
      .filter((n): n is string => typeof n === "string");
  } catch (e) {
    console.warn("Failed to parse domains.json:", e);
    return [];
  }

  const files = readdirSync(tablesDir);
  const result: DomainInfo[] = domainNames
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map((domainName) => {
      const prefix = `${domainName}.`;
      const suffix = ".json";
      const tableFiles = files.filter(
        (f) => f.startsWith(prefix) && f.endsWith(suffix) && f.length > prefix.length + suffix.length
      );
      const tables: TableInfo[] = tableFiles
        .map((f) => {
          const base = f.slice(0, -suffix.length);
          const tableName = base.slice(prefix.length);
          return {
            name: tableName,
            filePath: path.join(tablesDir, f),
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
      return { name: domainName, tables };
    });

  return result;
}

export function getDomain(domainName: string): DomainInfo | null {
  const domains = getDomains();
  return domains.find((d) => d.name === domainName) ?? null;
}

export function getTableJson(
  domainName: string,
  tableName: string
): Record<string, unknown> | null {
  const domain = getDomain(domainName);
  if (!domain) return null;
  const table = domain.tables.find((t) => t.name === tableName);
  if (!table || !existsSync(table.filePath)) return null;
  try {
    const raw = readFileSync(table.filePath, "utf-8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getTableRelationsJson(
  domainName: string,
  tableName: string
): Record<string, unknown> | null {
  const tableRelationsDir = getTableRelationsDir();
  if (!tableRelationsDir || !existsSync(tableRelationsDir)) return null;

  const fileName = `${domainName}.${tableName}-relations.json`;
  const filePath = path.join(tableRelationsDir, fileName);
  if (!existsSync(filePath)) return null;

  try {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}
