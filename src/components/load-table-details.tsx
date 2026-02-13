"use client";

import {
  SchemaNode,
  normalizeHandleId,
} from "@/components/schema-node";
import {
  formatAttributeValue,
  getAttributeKeys,
} from "@/lib/format-utils";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import type { Edge, Node } from "reactflow";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  Position,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { Maximize2, Minimize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

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

const relationNodeTypes = {
  relationNode: SchemaNode,
};

export function TableDetails({
  tableName,
  tableJson,
  relationsJson,
}: TableDetailsProps) {
  const TAB_STORAGE_KEY = "load-details-tab";
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [relationsMaximized, setRelationsMaximized] = useState(false);

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
        new Set(columns.filter((c): c is RelationColumn & { name: string } => typeof c?.name === "string").map((c) => normalizeHandleId(c.name)))
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
          type: "default",
          style: {
            stroke: "#777",
            strokeWidth: 2,
            strokeDasharray: "5,5",
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
          markerStart: "url(#lineage-dot)",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#777",
          },
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
            <>
              {/* Define custom markers for ReactFlow edges */}
              <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
                <defs>
                  <marker
                    id="lineage-dot"
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="5"
                    markerWidth="4"
                    markerHeight="4"
                    orient="auto-start-reverse"
                  >
                    <circle cx="5" cy="5" r="4" fill="#777" />
                  </marker>
                </defs>
              </svg>

              {!relationsMaximized && (
                <div className="h-[700px] w-full overflow-hidden rounded-3xl border border-border/60 bg-background/50 backdrop-blur-sm shadow-2xl transition-all duration-300 hover:border-border/80 relative">
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
                    <Controls showInteractive={false} className="bg-background! border-border/50! shadow-xl! rounded-lg overflow-hidden">
                      {/* <button
                        type="button"
                        onClick={() => setRelationsMaximized(true)}
                        className="react-flow__controls-button react-flow__controls-maximize"
                        title="Maximize relations"
                        aria-label="Maximize relations"
                      >
                        <Maximize2 className="size-4" />
                      </button> */}
                    </Controls>
                  </ReactFlow>
                </div>
              )}
              <Dialog open={relationsMaximized} onOpenChange={setRelationsMaximized}>
                <DialogContent
                  showCloseButton={false}
                  className="fixed inset-0 top-0 left-0 right-0 bottom-0 translate-x-0 translate-y-0 w-screen min-w-full h-dvh max-w-none rounded-none border-0 p-0 gap-0 flex flex-col bg-background"
                >
                  <DialogTitle className="sr-only">
                    Relations — full screen
                  </DialogTitle>
                  <div className="flex items-center justify-between shrink-0 px-4 py-2 border-b border-border/60 bg-muted/30">
                    <span className="text-sm font-semibold">Relations — full screen</span>
                    <button
                      type="button"
                      onClick={() => setRelationsMaximized(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      aria-label="Exit full screen"
                    >
                      <Minimize2 className="size-4" />
                      <span>Exit full screen</span>
                    </button>
                  </div>
                  <div className="flex-1 min-h-0 w-full">
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
                      <Controls showInteractive={false} className="bg-background! border-border/50! shadow-xl! rounded-lg overflow-hidden">
                        {/* <button
                          type="button"
                          onClick={() => setRelationsMaximized(false)}
                          className="react-flow__controls-button react-flow__controls-maximize"
                          title="Exit full screen"
                          aria-label="Exit full screen"
                        >
                          <Minimize2 className="size-4" />
                        </button> */}
                      </Controls>
                    </ReactFlow>
                  </div>
                </DialogContent>
              </Dialog>
            </>
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
        /* Maximize button icon: always black on white control panel */
        .react-flow__controls-button.react-flow__controls-maximize svg {
          color: #111 !important;
          stroke: #111 !important;
          fill: none !important;
        }
      `}</style>
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

