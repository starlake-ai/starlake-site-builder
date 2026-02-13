"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  formatAttributeValue,
  getAttributeKeys,
} from "@/lib/format-utils";
import {
  SchemaNode,
  normalizeHandleId,
} from "@/components/schema-node";
import { Copy, Check, Maximize2, Minimize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import CodeMirror from "@uiw/react-codemirror";
import { sql as sqlLang } from "@codemirror/lang-sql";
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

interface TransformTaskDetailsProps {
  taskName: string;
  taskJson: JsonRecord;
  lineageJson?: JsonRecord | null;
}

type TabId = "general" | "attributes" | "sql" | "lineage";

const TAB_LABELS: Record<TabId, string> = {
  general: "General",
  attributes: "Attributes",
  sql: "SQL",
  lineage: "Lineage",
};

interface LineageColumnInfo {
  name: string;
  primaryKey?: boolean;
  foreignKey?: boolean;
}

interface LineageTable {
  domain?: string;
  table?: string;
  columns?: (string | LineageColumnInfo)[];
  isTask?: boolean;
}

interface LineageRef {
  domain?: string;
  table?: string;
  column?: string;
}

interface LineageRelation {
  from?: LineageRef;
  to?: LineageRef;
  expression?: string;
}

/** Node id for lineage: "domain.table" when domain is set, else "table" (for intermediate/CTE tables). */
function getLineageNodeId(domain: string | undefined, table: string | undefined): string {
  if (typeof table !== "string") return "";
  if (typeof domain === "string" && domain.trim() !== "") return `${domain}.${table}`;
  return table;
}

const lineageNodeTypes = {
  lineageNode: SchemaNode,
};

export function TransformTaskDetails({
  taskName,
  taskJson,
  lineageJson,
}: TransformTaskDetailsProps) {
  const TAB_STORAGE_KEY = "transform-details-tab";
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [copied, setCopied] = useState(false);
  const [lineageMaximized, setLineageMaximized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(TAB_STORAGE_KEY) as TabId | null;
      if (saved && ["general", "attributes", "sql", "lineage"].includes(saved)) {
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
  const { resolvedTheme } = useTheme();

  const rawWriteStrategy =
    (taskJson.writeStrategy as unknown) ??
    (taskJson.write_strategy as unknown) ??
    (taskJson.strategy as unknown);
  const writeStrategy = formatWriteStrategy(rawWriteStrategy);
  const tagsRaw = taskJson.tags;

  const tags =
    Array.isArray(tagsRaw) && tagsRaw.length > 0
      ? (tagsRaw as unknown[])
          .map((t) => (typeof t === "string" ? t : String(t)))
          .join(", ")
      : typeof tagsRaw === "string"
      ? tagsRaw
      : undefined;

  const attributes = Array.isArray(taskJson.attributes)
    ? (taskJson.attributes as JsonRecord[])
    : [];

  const attributeKeys = getAttributeKeys(attributes);

  const sql =
    typeof taskJson.sql === "string"
      ? taskJson.sql
      : typeof (taskJson as JsonRecord).SQL === "string"
      ? String((taskJson as JsonRecord).SQL)
      : typeof (taskJson as JsonRecord).query === "string"
      ? String((taskJson as JsonRecord).query)
      : typeof (taskJson as JsonRecord).statement === "string"
      ? String((taskJson as JsonRecord).statement)
      : undefined;

  const lineageTables = useMemo(
    () =>
      Array.isArray(lineageJson?.tables)
        ? (lineageJson.tables as LineageTable[])
        : [],
    [lineageJson]
  );

  const lineageRelations = useMemo(
    () =>
      Array.isArray(lineageJson?.relations)
        ? (lineageJson.relations as LineageRelation[])
        : [],
    [lineageJson]
  );

  const hasLineageData = lineageTables.length > 0;

  const columnExpressionsByNodeId = useMemo(() => {
    const map = new Map<string, Map<string, string[]>>();
    const add = (nodeId: string, column: string | undefined, expression: string | undefined) => {
      if (!nodeId || column == null || expression == null || expression === "") return;
      const colKey = normalizeHandleId(column);
      if (!colKey) return;
      let colMap = map.get(nodeId);
      if (!colMap) {
        colMap = new Map<string, string[]>();
        map.set(nodeId, colMap);
      }
      const list = colMap.get(colKey) ?? [];
      if (!list.includes(expression)) list.push(expression);
      colMap.set(colKey, list);
    };
    lineageRelations.forEach((rel) => {
      if (typeof rel?.from?.table !== "string" || typeof rel?.to?.table !== "string") return;
      const fromId = getLineageNodeId(rel.from?.domain, rel.from?.table);
      const toId = getLineageNodeId(rel.to?.domain, rel.to?.table);
      if (!fromId || !toId) return;
      const expr = typeof rel.expression === "string" ? rel.expression : undefined;
      add(fromId, rel.from?.column, expr);
      add(toId, rel.to?.column, expr);
    });
    return map;
  }, [lineageRelations]);

  const attrByName = useMemo(() => {
    const m = new Map<string, { primaryKey?: boolean; foreignKey?: boolean }>();
    (attributes as JsonRecord[]).forEach((a) => {
      const name = (a.name ?? a.Name ?? a.column ?? a.column_name) as string | undefined;
      if (typeof name === "string") {
        m.set(name.trim().toLowerCase(), {
          primaryKey: a.primaryKey === true || a.primary_key === true || a.pk === true,
          foreignKey: a.foreignKey === true || a.foreign_key === true || a.fk === true,
        });
      }
    });
    return m;
  }, [attributes]);

  const initialNodes: Node[] = useMemo(
    () =>
      lineageTables
        .filter((item): item is LineageTable & { table: string } => typeof item?.table === "string")
        .map((item, index) => {
          const nodeId = getLineageNodeId(item.domain, item.table);
          const baseColumns: LineageColumnInfo[] = Array.isArray(item.columns)
            ? item.columns.map((c): LineageColumnInfo => {
                if (typeof c === "string") return { name: c.trim() };
                const obj = c as LineageColumnInfo & { name?: string };
                return {
                  name: (obj.name ?? String(c)).trim(),
                  primaryKey: obj.primaryKey === true,
                  foreignKey: obj.foreignKey === true,
                };
              })
            : [];
          const enrichedColumns = baseColumns.map((col) => {
            const fromAttr = attrByName.get(col.name.toLowerCase());
            if (fromAttr && (!col.primaryKey && !col.foreignKey)) {
              return {
                ...col,
                primaryKey: fromAttr.primaryKey ?? col.primaryKey,
                foreignKey: fromAttr.foreignKey ?? col.foreignKey,
              };
            }
            return col;
          });
          const columnExpressions: Record<string, string[]> = {};
          const colMap = columnExpressionsByNodeId.get(nodeId);
          if (colMap) {
            colMap.forEach((exprs, colKey) => {
              columnExpressions[colKey] = exprs;
            });
          }
          return {
            id: nodeId,
            type: "lineageNode",
            position: {
              x: 80 + (index % 3) * 340,
              y: 40 + Math.floor(index / 3) * 240,
            },
            data: {
              domain: item.domain ?? "",
              table: item.table,
              columns: enrichedColumns,
              columnExpressions: Object.keys(columnExpressions).length > 0 ? columnExpressions : undefined,
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            draggable: true,
          };
        }),
    [lineageTables, attrByName, columnExpressionsByNodeId]
  );

  const initialEdges: Edge[] = useMemo(() => {
    const nodeColumnsById = new Map<string, Set<string>>();
    const nodeOrderById = new Map<string, number>();
    
    lineageTables.forEach((table) => {
      if (typeof table.table !== "string") return;
      const nodeId = getLineageNodeId(table.domain, table.table);
      const columns = Array.isArray(table.columns) ? table.columns : [];
      nodeOrderById.set(nodeId, nodeOrderById.size);
      nodeColumnsById.set(
        nodeId,
        new Set(columns.map((c) => normalizeHandleId(typeof c === "string" ? c : (c as LineageColumnInfo).name)))
      );
    });

    return lineageRelations
      .filter(
        (relation) =>
          typeof relation?.from?.table === "string" && typeof relation?.to?.table === "string"
      )
      .map((relation, index) => {
        const source = getLineageNodeId(relation.from?.domain, relation.from?.table);
        const target = getLineageNodeId(relation.to?.domain, relation.to?.table);
        if (!source || !target) return null;
        const sourceHandleCandidate = normalizeHandleId(relation.from?.column);
        const targetHandleCandidate = normalizeHandleId(relation.to?.column);
        
        const sourceHasHandle = Boolean(
          sourceHandleCandidate && nodeColumnsById.get(source)?.has(sourceHandleCandidate)
        );
        const targetHasHandle = Boolean(
          targetHandleCandidate && nodeColumnsById.get(target)?.has(targetHandleCandidate)
        );
        
        const sourceOrder = nodeOrderById.get(source) ?? 0;
        const targetOrder = nodeOrderById.get(target) ?? 0;
        const isLeftToRight = sourceOrder <= targetOrder;

        const edge: Edge = {
          id: `lineage-${index}`,
          source,
          target,
          type: "default",
          style: {
            stroke: "#777",
            strokeWidth: 2,
            strokeDasharray: "5,5",
          },
          markerStart: "url(#lineage-dot)",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#777",
          },
        };

        if (sourceHasHandle && sourceHandleCandidate) {
          edge.sourceHandle = `${isLeftToRight ? "s-r" : "s-l"}:${sourceHandleCandidate}`;
        }
        if (targetHasHandle && targetHandleCandidate) {
          edge.targetHandle = `${isLeftToRight ? "t-l" : "t-r"}:${targetHandleCandidate}`;
        }

        return edge;
      })
      .filter((e): e is Edge => e != null);
  }, [lineageRelations, lineageTables]);

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
        {(["general", "attributes", "sql", "lineage"] as TabId[]).map((tab) => (
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
                  Task name
                </td>
                <td className="px-6 py-5 align-top font-mono text-[13px] text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  {String(taskName)}
                </td>
              </tr>
              <tr className="group hover:bg-muted/20 transition-all duration-200">
                <td className="w-64 px-6 py-5 align-top text-[13px] font-bold text-foreground/90 group-hover:text-foreground">
                  Write strategy
                </td>
                <td className="px-6 py-5 align-top font-mono text-[13px] text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  {writeStrategy ?? "—"}
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
              No attributes found for this task.
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

      {activeTab === "sql" && (
        <div className="space-y-4">
          {sql ? (
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:border-border/80">
              <div className="flex items-center justify-end gap-2 border-b border-border/60 bg-muted/30 px-4 py-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(sql);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      // fallback ignored
                    }
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Copy SQL"
                >
                  {copied ? (
                    <>
                      <Check className="size-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="max-h-[420px] overflow-y-auto w-full bg-card">
                <CodeMirror
                  value={sql}
                  extensions={[sqlLang()]}
                  basicSetup={{
                    highlightActiveLine: false,
                    highlightActiveLineGutter: false,
                  }}
                  theme={resolvedTheme === "dark" ? "dark" : "light"}
                  editable={false}
                  height="400px"
                  className="text-[13px] border-0"
                />
              </div>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed border-border/40">
              No SQL definition found for this task.
            </p>
          )}
        </div>
      )}
      {activeTab === "lineage" && (
        <div className="space-y-4">
          {!lineageJson || !hasLineageData ? (
            <p className="py-12 text-center text-sm text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed border-border/40">
              No lineage found for this task.
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

              {!lineageMaximized && (
                <div className="h-[700px] w-full overflow-hidden rounded-3xl border border-border/60 bg-background/50 backdrop-blur-sm shadow-2xl transition-all duration-300 hover:border-border/80 relative">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={lineageNodeTypes}
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
                        onClick={() => setLineageMaximized(true)}
                        className="react-flow__controls-button react-flow__controls-maximize"
                        title="Maximize lineage"
                        aria-label="Maximize lineage"
                      >
                        <Maximize2 className="size-4" />
                      </button> */}
                    </Controls>
                  </ReactFlow>
                </div>
              )}
              <Dialog open={lineageMaximized} onOpenChange={setLineageMaximized}>
                <DialogContent
                  showCloseButton={false}
                  className="fixed inset-0 top-0 left-0 right-0 bottom-0 translate-x-0 translate-y-0 w-screen min-w-full h-dvh max-w-none rounded-none border-0 p-0 gap-0 flex flex-col bg-background"
                >
                  <DialogTitle className="sr-only">
                    Lineage — full screen
                  </DialogTitle>
                  <div className="flex items-center justify-between shrink-0 px-4 py-2 border-b border-border/60 bg-muted/30">
                    <span className="text-sm font-semibold">Lineage — full screen</span>
                    <button
                      type="button"
                      onClick={() => setLineageMaximized(false)}
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
                      nodeTypes={lineageNodeTypes}
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
                          onClick={() => setLineageMaximized(false)}
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
        .cm-editor, .cm-scroller {
          background-color: transparent !important;
        }
        .cm-gutters {
          background-color: transparent !important;
          border-right: 1px solid rgb(var(--border) / 0.2) !important;
          color: rgb(var(--muted-foreground)) !important;
        }
        .cm-content {
          color: rgb(var(--foreground)) !important;
        }
      `}</style>
    </div>
  );
}

function formatWriteStrategy(value: unknown): string | undefined {
  if (value == null) return undefined;

  if (typeof value === "string") return value;

  if (typeof value === "object") {
    const obj = value as { type?: unknown; [key: string]: unknown };
    if (typeof obj.type === "string") {
      return obj.type;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}


