"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Table as TableIcon } from "lucide-react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  useEdgesState,
  useNodesState,
} from "reactflow";
import type { Edge, Node, NodeProps } from "reactflow";
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

interface RelationNodeData {
  domain: string;
  table: string;
  columns: string[];
}

function RelationNode({ data }: NodeProps<RelationNodeData>) {
  return (
    <div className="min-w-64 overflow-hidden rounded-lg shadow-lg border-0 bg-[#f5f5f5] dark:bg-card">
      <div className="relative border-b-2 border-primary bg-primary px-4 py-3 dark:border-muted dark:bg-muted">
        <div className="text-center text-[11px] font-bold uppercase tracking-wider text-primary-foreground/80 dark:text-muted-foreground">
          {data.domain}
        </div>
        <div className="text-center text-[15px] font-extrabold text-primary-foreground dark:text-foreground mt-0.5">
          {data.table}
        </div>
        <TableIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/90 dark:text-muted-foreground" />
      </div>
      <div className="bg-[#f5f5f5] dark:bg-card">
        {data.columns.map((column, rowIndex) => (
          <div
            key={`${data.domain}.${data.table}.${column}`}
            className={cn(
              "relative px-4 py-2 text-left text-[13px] font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5",
              rowIndex % 2 === 0 
                ? "bg-[#eee] dark:bg-card" 
                : "bg-[#dfdcdc] dark:bg-muted/30"
            )}
            style={{ color: "var(--node-text-color)" }}
          >
            {(() => {
              const id = normalizeHandleId(column);
              return (
                <>
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={`t-l:${id}`}
                    style={{
                      left: -5,
                      width: 6,
                      height: 6,
                      borderRadius: 0,
                      background: "#444",
                      border: "none",
                    }}
                  />
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`s-r:${id}`}
                    style={{
                      right: -5,
                      width: 6,
                      height: 6,
                      borderRadius: 0,
                      background: "#444",
                      border: "none",
                    }}
                  />
                  <Handle
                    type="source"
                    position={Position.Left}
                    id={`s-l:${id}`}
                    style={{
                      left: -5,
                      width: 1,
                      height: 1,
                      opacity: 0,
                      border: "none",
                    }}
                  />
                  <Handle
                    type="target"
                    position={Position.Right}
                    id={`t-r:${id}`}
                    style={{
                      right: -5,
                      width: 1,
                      height: 1,
                      opacity: 0,
                      border: "none",
                    }}
                  />
                </>
              );
            })()}
            <span className="text-[#444] dark:text-foreground">{column}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        div {
          --node-text-color: #444;
        }
        :global(.dark) div {
          --node-text-color: rgb(var(--foreground));
        }
      `}</style>
    </div>
  );
}

const relationNodeTypes = {
  relationNode: RelationNode,
};

function normalizeHandleId(value?: string): string {
  return (value ?? "").trim();
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
        .map((item, index) => {
          const { domain, table } = getDomainAndTable(item.id);
          return {
            id: item.id,
            type: "relationNode",
            position: {
              x: 80 + (index % 3) * 340,
              y: 40 + Math.floor(index / 3) * 240,
            },
            data: {
              domain,
              table: table || item.label,
              columns: (item.columns ?? [])
                .filter((c): c is RelationColumn & { name: string } => typeof c?.name === "string")
                .map((c) => c.name),
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            draggable: true,
          };
        }),
    [relationItems]
  );

  const initialEdges: Edge[] = useMemo(() => {
    const nodeColumnsById = new Map<string, Set<string>>();
    const nodeOrderById = new Map<string, number>();

    relationItems.forEach((item) => {
      if (typeof item.id !== "string") return;
      nodeOrderById.set(item.id, nodeOrderById.size);
      const columns = Array.isArray(item.columns) ? item.columns : [];
      nodeColumnsById.set(
        item.id,
        new Set(columns.filter(c => typeof c.name === "string").map((c) => normalizeHandleId(c.name)))
      );
    });

    return relationLinks
      .filter((relation) => typeof relation?.source === "string" && typeof relation?.target === "string")
      .map((relation, index) => {
        const sourceParts = relation.source!.split(".");
        const targetParts = relation.target!.split(".");
        
        const sourceNodeId = sourceParts.slice(0, 2).join(".");
        const targetNodeId = targetParts.slice(0, 2).join(".");
        
        const sourceColumn = sourceParts[2];
        const targetColumn = targetParts[2];

        const sourceHandleCandidate = normalizeHandleId(sourceColumn);
        const targetHandleCandidate = normalizeHandleId(targetColumn);

        const sourceHasHandle = Boolean(
          sourceHandleCandidate && nodeColumnsById.get(sourceNodeId)?.has(sourceHandleCandidate)
        );
        const targetHasHandle = Boolean(
          targetHandleCandidate && nodeColumnsById.get(targetNodeId)?.has(targetHandleCandidate)
        );

        const sourceOrder = nodeOrderById.get(sourceNodeId) ?? 0;
        const targetOrder = nodeOrderById.get(targetNodeId) ?? 0;
        const isLeftToRight = sourceOrder <= targetOrder;

        const edge: Edge = {
          id: `relation-${index}`,
          source: sourceNodeId,
          target: targetNodeId,
          label: relation.relationType,
          type: "smoothstep",
          style: {
            stroke: "#777",
            strokeWidth: 2,
          },
          labelStyle: {
            fill: "rgb(var(--foreground))",
            fontSize: 10,
            fontWeight: 600,
          },
          labelBgStyle: {
            fill: "rgb(var(--background))",
            fillOpacity: 0.8,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#777",
          },
          animated: true,
        };

        if (sourceHasHandle) {
          edge.sourceHandle = `${isLeftToRight ? "s-r" : "s-l"}:${sourceHandleCandidate}`;
        }
        if (targetHasHandle) {
          edge.targetHandle = `${isLeftToRight ? "t-l" : "t-r"}:${targetHandleCandidate}`;
        }

        return edge;
      });
  }, [relationLinks, relationItems]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-wrap items-center rounded-xl bg-muted/80 p-1.5 shadow-inner backdrop-blur-sm border border-border/50 gap-1.5 sm:gap-2 w-fit max-w-full">
        {(["general", "attributes", "relations"] as TabId[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
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
        <div className="space-y-4">
          {!relationsJson || !hasRelationsData ? (
            <p className="py-12 text-center text-sm text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed border-border/40">
              No relations found for this table.
            </p>
          ) : (
            <div className="h-[700px] w-full overflow-hidden rounded-3xl border border-border/60 bg-background/50 backdrop-blur-sm shadow-2xl transition-all duration-300 hover:border-border/80">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={relationNodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                minZoom={0.2}
                maxZoom={1.5}
                proOptions={{ hideAttribution: true }}
                style={{
                  background: "transparent",
                  color: "rgb(var(--foreground))",
                }}
              >
                <Background />
                <Controls className="!bg-background !border-border/50 !shadow-xl rounded-lg overflow-hidden" />
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

