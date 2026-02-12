"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  Position,
  useEdgesState,
  useNodesState,
} from "reactflow";
import type { Edge, Node } from "reactflow";
import "reactflow/dist/style.css";

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
  const [activeTab, setActiveTab] = useState<TabId>("general");

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

  const attributeKeys =
    attributes.length > 0 ? Object.keys(attributes[0] ?? {}) : [];

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

  const initialNodes: Node[] = useMemo(
    () =>
      relationItems
        .filter((item): item is Required<Pick<RelationItem, "id" | "label">> & RelationItem =>
          typeof item?.id === "string" && typeof item?.label === "string"
        )
        .map((item, index) => ({
          id: item.id,
          type: "default",
          position: {
            x: 80 + (index % 4) * 280,
            y: 40 + Math.floor(index / 4) * 180,
          },
          data: {
            label: (
              <div className="min-w-56 overflow-hidden rounded-md">
                <div className="border-b border-border bg-muted px-3 py-2">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {getDomainAndTable(item.id).domain}
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {getDomainAndTable(item.id).table || item.label}
                  </div>
                </div>
                <div>
                  {(item.columns ?? [])
                    .filter((column): column is RelationColumn & { name: string } => typeof column?.name === "string")
                    .map((column, rowIndex) => (
                      <div
                        key={column.id ?? column.name}
                        className={cn(
                          "flex items-center justify-between px-3 py-1.5 text-[11px]",
                          rowIndex % 2 === 0 ? "bg-card" : "bg-muted/40"
                        )}
                      >
                        <span className="truncate text-muted-foreground">
                          {column.name}
                          {column.columnType ? `:${column.columnType}` : ""}
                        </span>
                        {column.primaryKey ? (
                          <span className="ml-2 shrink-0 font-semibold text-foreground">PK</span>
                        ) : (
                          <span className="ml-2 shrink-0 opacity-0">PK</span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ),
          },
          style: {
            background: "hsl(var(--card))",
            color: "hsl(var(--card-foreground))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 10,
            minWidth: 220,
            padding: 0,
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          draggable: true,
        })),
    [relationItems]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      relationLinks
        .filter((relation) => typeof relation?.source === "string" && typeof relation?.target === "string")
        .map((relation, index) => {
          const sourceId = relation.source!.split(".").slice(0, 2).join(".");
          const targetId = relation.target!.split(".").slice(0, 2).join(".");
          return {
            id: `relation-${index}`,
            source: sourceId,
            target: targetId,
            label: relation.relationType,
            type: "smoothstep",
            style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1.5 },
            labelStyle: {
              fill: "hsl(var(--foreground))",
              fontSize: 11,
              fontWeight: 500,
            },
            labelBgStyle: {
              fill: "hsl(var(--background))",
              fillOpacity: 0.9,
            },
            markerEnd: { type: MarkerType.ArrowClosed },
          };
        }),
    [relationLinks]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-md border bg-muted p-1 text-sm">
        {(["general", "attributes", "relations"] as TabId[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {activeTab === "general" && (
        <div className="overflow-hidden rounded-md border bg-muted/40 text-sm">
          <table className="w-full border-collapse">
            <thead className="bg-muted/60">
              <tr>
                <th className="w-40 border-b px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground text-left">
                  Property
                </th>
                <th className="border-b px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground text-left">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="w-40 border-b px-3 py-2 align-top text-xs font-medium text-foreground">
                  Table name
                </td>
                <td className="border-b px-3 py-2 align-top font-mono text-xs text-muted-foreground">
                  {String(tableName)}
                </td>
              </tr>
              <tr>
                <td className="w-40 border-b px-3 py-2 align-top text-xs font-medium text-foreground">
                  Pattern
                </td>
                <td className="border-b px-3 py-2 align-top font-mono text-xs text-muted-foreground">
                  {pattern ? String(pattern) : "—"}
                </td>
              </tr>
              <tr>
                <td className="w-40 border-b px-3 py-2 align-top text-xs font-medium text-foreground">
                  Primary key
                </td>
                <td className="border-b px-3 py-2 align-top font-mono text-xs text-muted-foreground">
                  {primaryKey ? String(primaryKey) : "—"}
                </td>
              </tr>
              <tr>
                <td className="w-40 px-3 py-2 align-top text-xs font-medium text-foreground">
                  Tags
                </td>
                <td className="px-3 py-2 align-top font-mono text-xs text-muted-foreground">
                  {tags ? String(tags) : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "attributes" && (
        <div className="space-y-3">
          {attributes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No attributes found for this table.
            </p>
          ) : (
            <div className="relative w-full overflow-auto rounded-md border bg-muted/40">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    {attributeKeys.map((key) => (
                      <th
                        key={key}
                        className="border-b px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attributes.map((attr, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-background" : ""}
                    >
                      {attributeKeys.map((key) => (
                        <td
                          key={key}
                          className="border-b px-3 py-2 align-top text-xs text-muted-foreground"
                        >
                          {formatCellValue(attr[key])}
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
        <div className="space-y-3">
          {!relationsJson || !hasRelationsData ? (
            <p className="text-sm text-muted-foreground">
              No relations found for this table.
            </p>
          ) : (
            <div className="h-[560px] w-full overflow-hidden rounded-md border bg-background">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                minZoom={0.2}
                maxZoom={1.5}
                proOptions={{ hideAttribution: true }}
                style={{
                  background: "hsl(var(--background))",
                  color: "hsl(var(--foreground))",
                }}
              >
                <Background gap={18} color="hsl(var(--border))" />
                <Controls />
              </ReactFlow>
            </div>
          )}
        </div>
      )}
      <style jsx global>{`
        .react-flow__node:focus,
        .react-flow__node:focus-visible,
        .react-flow__node.selected,
        .react-flow__node-default.selectable:focus,
        .react-flow__node-default.selectable.selected {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}

function formatCellValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getDomainAndTable(itemId?: string): { domain: string; table: string } {
  if (!itemId) return { domain: "domain", table: "" };
  const [domain, table] = itemId.split(".");
  return {
    domain: domain || "domain",
    table: table || "",
  };
}

