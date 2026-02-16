"use client";

import { FlowGraph } from "@/components/flow-graph";
import {
  formatAttributeValue,
  getAttributeKeys,
} from "@/lib/format-utils";
import {
  buildNodeColumnsMap,
  computeNodeDepthMap,
  computeNodePosition,
  createStyledEdge,
} from "@/lib/graph-layout";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import type { Edge, Node } from "reactflow";
import { Position } from "reactflow";

type JsonRecord = Record<string, unknown>;

interface TableDetailsProps {
  tableName: string;
  tableJson: JsonRecord;
  relationsJson?: JsonRecord | null;
}

type TabId = "general" | "attributes" | "relations";

const TAB_LABELS: Record<TabId, string> = {
  general: "General",
  attributes: "Attributes",
  relations: "Relations",
};

interface RelationColumn {
  id?: string;
  name?: string;
  columnType?: string;
  primaryKey?: boolean;
  foreignKey?: boolean;
}

interface RelationItem {
  id?: string;
  label?: string;
  columns?: RelationColumn[];
}

interface RelationLink {
  source?: string;
  target?: string;
  relationType?: string;
}

export function TableDetails({
  tableName,
  tableJson,
  relationsJson,
}: TableDetailsProps) {
  const TAB_STORAGE_KEY = "load-details-tab";
  const [activeTab, setActiveTab] = useState<TabId>("general");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(TAB_STORAGE_KEY) as TabId | null;
      if (saved && ["general", "attributes", "relations"].includes(saved)) {
        setActiveTab(saved);
      }
    }
  }, []);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      localStorage.setItem(TAB_STORAGE_KEY, tab);
    }
  };

  const pattern =
    (tableJson.pattern as string | undefined) ??
    (tableJson.Pattern as string | undefined);
  const primaryKeyRaw =
    tableJson.primaryKey ?? tableJson.primary_key ?? tableJson.pk;
  const tagsRaw = tableJson.tags;

  const primaryKey =
    Array.isArray(primaryKeyRaw) && primaryKeyRaw.length > 0
      ? primaryKeyRaw.join(", ")
      : typeof primaryKeyRaw === "string"
      ? primaryKeyRaw
      : undefined;

  const tags =
    Array.isArray(tagsRaw) && tagsRaw.length > 0
      ? (tagsRaw as unknown[])
          .map((t) => (typeof t === "string" ? t : String(t)))
          .join(", ")
      : typeof tagsRaw === "string"
      ? tagsRaw
      : undefined;

  const attributes = Array.isArray(tableJson.attributes)
    ? (tableJson.attributes as JsonRecord[])
    : [];

  const attributeKeys = getAttributeKeys(attributes);

  const relationItems = useMemo(
    () =>
      Array.isArray(relationsJson?.items)
        ? (relationsJson.items as RelationItem[])
        : [],
    [relationsJson]
  );
  const relationLinks = useMemo(
    () =>
      Array.isArray(relationsJson?.relations)
        ? (relationsJson.relations as RelationLink[])
        : [],
    [relationsJson]
  );
  const hasRelationsData = relationItems.length > 0;


  const validItems = useMemo(
    () =>
      relationItems.filter(
        (item): item is Required<Pick<RelationItem, "id" | "label">> & RelationItem =>
          typeof item?.id === "string" && typeof item?.label === "string"
      ),
    [relationItems]
  );

  const nodeDepthMap = useMemo(() => {
    const nodeIds = validItems.map((item) => item.id);
    const relations = relationLinks
      .filter((r) => typeof r?.source === "string" && typeof r?.target === "string")
      .map((r) => ({
        sourceId: r.source!.split(".").slice(0, 2).join("."),
        targetId: r.target!.split(".").slice(0, 2).join("."),
      }));
    return computeNodeDepthMap(nodeIds, relations);
  }, [validItems, relationLinks]);

  const initialNodes: Node[] = useMemo(() => {
    const depthSlots = new Map<number, number>();
    return validItems.map((item) => {
      const { domain, table } = getDomainAndTable(item.id);
      const depth = nodeDepthMap.get(item.id) ?? 0;
      const slotIndex = depthSlots.get(depth) ?? 0;
      depthSlots.set(depth, slotIndex + 1);
      return {
        id: item.id,
        type: "schemaNode",
        position: computeNodePosition(depth, slotIndex),
        data: {
          domain,
          table: table || item.label,
          columns: (item.columns ?? [])
            .filter((c): c is RelationColumn & { name: string } => typeof c?.name === "string")
            .map((c) => ({
              name: c.name,
              primaryKey: c.primaryKey === true,
              foreignKey: c.foreignKey === true,
            })),
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        draggable: true,
      };
    });
  }, [validItems, nodeDepthMap]);

  const nodeColumnsById = useMemo(
    () =>
      buildNodeColumnsMap(
        validItems.map((item) => ({
          nodeId: item.id,
          columns: (item.columns ?? [])
            .filter((c): c is RelationColumn & { name: string } => typeof c?.name === "string")
            .map((c) => c.name),
        }))
      ),
    [validItems]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      relationLinks
        .filter((r) => typeof r?.source === "string" && typeof r?.target === "string")
        .map((relation, index) => {
          const sourceParts = relation.source!.split(".");
          const targetParts = relation.target!.split(".");
          return createStyledEdge({
            index,
            sourceNodeId: sourceParts.slice(0, 2).join("."),
            targetNodeId: targetParts.slice(0, 2).join("."),
            sourceColumn: sourceParts[2],
            targetColumn: targetParts[2],
            nodeColumnsById,
            nodeDepthMap,
            label: relation.relationType,
          });
        })
        .filter((e): e is Edge => e != null),
    [relationLinks, nodeColumnsById, nodeDepthMap]
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-wrap items-center rounded-xl bg-muted/80 p-1.5 shadow-inner backdrop-blur-sm border border-border/50 gap-1.5 sm:gap-2 w-fit max-w-full">
        {(["general", "attributes", "relations"] as TabId[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabChange(tab)}
            className={cn(
              "relative rounded-lg px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer whitespace-nowrap",
              activeTab === tab
                ? "bg-background text-foreground shadow-lg ring-1 ring-black/5 dark:ring-white/5"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            )}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {activeTab === "general" && (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:border-border/80">
          <table className="w-full border-collapse">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="w-64 border-b border-border/60 px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Property
                </th>
                <th className="border-b border-border/60 px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr className="group hover:bg-muted/20 transition-all duration-200">
                <td className="w-64 px-6 py-5 align-top text-[13px] font-bold text-foreground/90 group-hover:text-foreground">
                  Table name
                </td>
                <td className="px-6 py-5 align-top font-mono text-[13px] text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  {String(tableName)}
                </td>
              </tr>
              <tr className="group hover:bg-muted/20 transition-all duration-200">
                <td className="w-64 px-6 py-5 align-top text-[13px] font-bold text-foreground/90 group-hover:text-foreground">
                  Pattern
                </td>
                <td className="px-6 py-5 align-top font-mono text-[13px] text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  {pattern ? String(pattern) : "—"}
                </td>
              </tr>
              <tr className="group hover:bg-muted/20 transition-all duration-200">
                <td className="w-64 px-6 py-5 align-top text-[13px] font-bold text-foreground/90 group-hover:text-foreground">
                  Primary key
                </td>
                <td className="px-6 py-5 align-top font-mono text-[13px] text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  {primaryKey ? String(primaryKey) : "—"}
                </td>
              </tr>
              <tr className="group hover:bg-muted/20 transition-all duration-200">
                <td className="w-64 px-6 py-5 align-top text-[13px] font-bold text-foreground/90 group-hover:text-foreground">
                  Tags
                </td>
                <td className="px-6 py-5 align-top font-mono text-[13px] text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  {tags ? String(tags) : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "attributes" && (
        <div className="space-y-4">
          {attributes.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed border-border/40">
              No attributes found for this table.
            </p>
          ) : (
            <div className="relative w-full overflow-auto rounded-2xl border border-border/60 bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:border-border/80">
              <table className="w-full border-collapse text-left">
                <thead className="bg-muted/40">
                  <tr>
                    {attributeKeys.map((key) => (
                      <th
                        key={key}
                        className="border-b border-border/60 px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {attributes.map((attr, index) => (
                    <tr
                      key={index}
                      className="transition-all duration-200 hover:bg-muted/30"
                    >
                      {attributeKeys.map((key) => (
                        <td
                          key={key}
                          className="px-6 py-4 align-top text-[13px] text-muted-foreground/90"
                        >
                          {formatAttributeValue(key, attr)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "relations" && (
        <div className="space-y-4">
          {!relationsJson || !hasRelationsData ? (
            <p className="py-12 text-center text-sm text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed border-border/40">
              No relations found for this table.
            </p>
          ) : (
            <FlowGraph
              nodes={initialNodes}
              edges={initialEdges}
              title="Relations"
            />
          )}
        </div>
      )}
    </div>
  );
}

function getDomainAndTable(itemId?: string): { domain: string; table: string } {
  if (!itemId) return { domain: "domain", table: "" };
  const [domain, table] = itemId.split(".");
  return {
    domain: domain || "domain",
    table: table || "",
  };
}
