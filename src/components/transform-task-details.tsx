"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import CodeMirror from "@uiw/react-codemirror";
import { sql as sqlLang } from "@codemirror/lang-sql";
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

interface LineageTable {
  domain?: string;
  table?: string;
  columns?: string[];
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

interface LineageNodeData {
  domain: string;
  table: string;
  isTask: boolean;
  columns: string[];
}

function LineageNode({ data }: NodeProps<LineageNodeData>) {
  return (
    <div className="min-w-56 overflow-hidden rounded-md">
      <div
        className={cn(
          "border-b border-border px-3 py-2",
          data.isTask ? "bg-primary/15" : "bg-muted"
        )}
      >
        <div className="text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {data.domain}
        </div>
        <div className="text-center text-sm font-semibold text-foreground">
          {data.table}
        </div>
      </div>
      <div>
        {data.columns.map((column, rowIndex) => (
          <div
            key={`${data.domain}.${data.table}.${column}`}
            className={cn(
              "relative px-3 py-1.5 text-left text-[11px] text-muted-foreground",
              rowIndex % 2 === 0 ? "bg-card" : "bg-muted/40"
            )}
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
                      borderRadius: 999,
                      background: "hsl(var(--muted-foreground))",
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
                      borderRadius: 999,
                      background: "hsl(var(--muted-foreground))",
                      border: "none",
                    }}
                  />
                  {/* Hidden opposite-side handles let us render edges in both directions reliably. */}
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
            {column}
          </div>
        ))}
      </div>
    </div>
  );
}

const lineageNodeTypes = {
  lineageNode: LineageNode,
};

function normalizeHandleId(value?: string): string {
  return (value ?? "").trim();
}

export function TransformTaskDetails({
  taskName,
  taskJson,
  lineageJson,
}: TransformTaskDetailsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("general");
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

  const attributeKeys =
    attributes.length > 0 ? Object.keys(attributes[0] ?? {}) : [];

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

  const initialNodes: Node[] = useMemo(
    () =>
      lineageTables
        .filter(
          (item): item is Required<Pick<LineageTable, "domain" | "table">> & LineageTable =>
            typeof item?.domain === "string" && typeof item?.table === "string"
        )
        .map((item, index) => {
          const nodeId = `${item.domain}.${item.table}`;
          return {
            id: nodeId,
            type: "lineageNode",
            position: {
              x: 80 + (index % 3) * 320,
              y: 40 + Math.floor(index / 3) * 220,
            },
            data: {
              domain: item.domain,
              table: item.table,
              isTask: Boolean(item.isTask),
              columns: Array.isArray(item.columns)
                ? item.columns.map((c) => String(c).trim())
                : [],
            },
            style: {
              background: "hsl(var(--card))",
              color: "hsl(var(--card-foreground))",
              border: item.isTask
                ? "1px solid hsl(var(--primary))"
                : "1px solid hsl(var(--border))",
              borderRadius: 10,
              minWidth: 220,
              padding: 0,
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            draggable: true,
          };
        }),
    [lineageTables]
  );

  const initialEdges: Edge[] = useMemo(() => {
    const nodeColumnsById = new Map<string, Set<string>>();
    const nodeOrderById = new Map<string, number>();
    lineageTables.forEach((table) => {
      if (typeof table.domain !== "string" || typeof table.table !== "string") return;
      const nodeId = `${table.domain}.${table.table}`;
      const columns = Array.isArray(table.columns) ? table.columns : [];
      nodeOrderById.set(nodeId, nodeOrderById.size);
      nodeColumnsById.set(
        nodeId,
        new Set(columns.map((column) => normalizeHandleId(String(column))))
      );
    });

    return lineageRelations
      .filter(
        (relation) =>
          typeof relation?.from?.domain === "string" &&
          typeof relation?.from?.table === "string" &&
          typeof relation?.to?.domain === "string" &&
          typeof relation?.to?.table === "string"
      )
      .map((relation, index) => {
        const source = `${relation.from!.domain}.${relation.from!.table}`;
        const target = `${relation.to!.domain}.${relation.to!.table}`;
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

        return {
          id: `lineage-${index}`,
          source,
          target,
          sourceHandle:
            sourceHasHandle && sourceHandleCandidate
              ? `${isLeftToRight ? "s-r" : "s-l"}:${sourceHandleCandidate}`
              : undefined,
          targetHandle:
            targetHasHandle && targetHandleCandidate
              ? `${isLeftToRight ? "t-l" : "t-r"}:${targetHandleCandidate}`
              : undefined,
          type: "smoothstep",
          style: {
            stroke: "hsl(var(--muted-foreground))",
            strokeWidth: 1.4,
            strokeDasharray: "4 4",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "hsl(var(--muted-foreground))",
          },
        };
      });
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
    <div className="space-y-4">
      <div className="inline-flex rounded-md border bg-muted p-1 text-sm">
        {(["general", "attributes", "sql", "lineage"] as TabId[]).map((tab) => (
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
                  Task name
                </td>
                <td className="border-b px-3 py-2 align-top font-mono text-xs text-muted-foreground">
                  {String(taskName)}
                </td>
              </tr>
              <tr>
                <td className="w-40 border-b px-3 py-2 align-top text-xs font-medium text-foreground">
                  Write strategy
                </td>
                <td className="border-b px-3 py-2 align-top font-mono text-xs text-muted-foreground">
                  {writeStrategy ?? "—"}
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
              No attributes found for this task.
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

      {activeTab === "sql" && (
        <div className="space-y-3">
          {sql ? (
            <ScrollArea className="max-h-[500px] w-full rounded-md border bg-muted/40">
              <CodeMirror
                value={sql}
                extensions={[sqlLang()]}
                basicSetup={{
                  highlightActiveLine: false,
                  highlightActiveLineGutter: false,
                }}
                theme={resolvedTheme === "dark" ? "dark" : "light"}
                editable={false}
                height="100%"
                className="text-xs"
              />
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">
              No SQL definition found for this task.
            </p>
          )}
        </div>
      )}
      {activeTab === "lineage" && (
        <div className="space-y-3">
          {!lineageJson || !hasLineageData ? (
            <p className="text-sm text-muted-foreground">
              No lineage found for this task.
            </p>
          ) : (
            <div className="h-[560px] w-full overflow-hidden rounded-md border bg-background">
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


