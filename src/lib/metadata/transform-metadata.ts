import { createMetadataLoader, type ItemInfo } from "./metadata-loader";

const loader = createMetadataLoader({
  dataDir: "tasks",
  indexFileName: "tasks.json",
  relationsDir: "tasks-lineage",
  relationsSuffix: "-lineage",
});

export type TaskInfo = ItemInfo;

export interface TransformDomainInfo {
  name: string;
  tasks: TaskInfo[];
}

export function getTransformDomains(): TransformDomainInfo[] {
  return loader.getDomains().map((d) => ({ name: d.name, tasks: d.items }));
}

export function getTransformDomain(
  domainName: string
): TransformDomainInfo | null {
  const d = loader.getDomain(domainName);
  return d ? { name: d.name, tasks: d.items } : null;
}

export const getTaskJson = loader.getItemJson;

export const getTaskLineageJson = loader.getRelationsJson;
