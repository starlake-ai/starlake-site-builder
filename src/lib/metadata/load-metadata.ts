import { createMetadataLoader, type ItemInfo } from "./metadata-loader";

const loader = createMetadataLoader({
  dataDir: "tables",
  indexFileName: "domains.json",
  relationsDir: "table-relations",
  relationsSuffix: "-relations",
});

export type TableInfo = ItemInfo;

export interface DomainInfo {
  name: string;
  tables: TableInfo[];
}

export function getDomains(): DomainInfo[] {
  return loader.getDomains().map((d) => ({ name: d.name, tables: d.items }));
}

export function getDomain(domainName: string): DomainInfo | null {
  const d = loader.getDomain(domainName);
  return d ? { name: d.name, tables: d.items } : null;
}

export const getTableJson = loader.getItemJson;

export const getTableRelationsJson = loader.getRelationsJson;
