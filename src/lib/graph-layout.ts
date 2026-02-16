import { normalizeHandleId } from "@/components/schema-node";
import type { Edge } from "reactflow";
import { MarkerType } from "reactflow";

export const GRAPH_LAYOUT = {
  HORIZONTAL_SPACING: 400,
  VERTICAL_SPACING: 240,
  INITIAL_X: 80,
  INITIAL_Y: 40,
  MIN_ZOOM: 0.2,
  MAX_ZOOM: 1.5,
} as const;

export const EDGE_STYLE: React.CSSProperties = {
  stroke: "#777",
  strokeWidth: 2,
  strokeDasharray: "5,5",
};

export const EDGE_MARKERS = {
  markerStart: "url(#lineage-dot)",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "#777",
  },
} as const;


export function computeNodeDepthMap(
  nodeIds: string[],
  relations: ReadonlyArray<{ sourceId: string; targetId: string }>
): Map<string, number> {
  const depth = new Map<string, number>();
  for (const id of nodeIds) depth.set(id, 0);

  let changed = true;
  while (changed) {
    changed = false;
    for (const { sourceId, targetId } of relations) {
      if (!sourceId || !targetId || sourceId === targetId) continue;
      const fromD = depth.get(sourceId) ?? 0;
      const toD = depth.get(targetId) ?? 0;
      if (toD <= fromD) {
        depth.set(targetId, fromD + 1);
        changed = true;
      }
    }
  }
  return depth;
}

export function computeNodePosition(
  depth: number,
  slotIndex: number
): { x: number; y: number } {
  return {
    x: GRAPH_LAYOUT.INITIAL_X + depth * GRAPH_LAYOUT.HORIZONTAL_SPACING,
    y: GRAPH_LAYOUT.INITIAL_Y + slotIndex * GRAPH_LAYOUT.VERTICAL_SPACING,
  };
}

export function buildNodeColumnsMap(
  entries: ReadonlyArray<{ nodeId: string; columns: string[] }>
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const { nodeId, columns } of entries) {
    map.set(nodeId, new Set(columns.map(normalizeHandleId)));
  }
  return map;
}


export function createStyledEdge(params: {
  index: number;
  sourceNodeId: string;
  targetNodeId: string;
  sourceColumn?: string;
  targetColumn?: string;
  nodeColumnsById: Map<string, Set<string>>;
  nodeDepthMap: Map<string, number>;
  label?: string;
}): Edge | null {
  const {
    index,
    sourceNodeId,
    targetNodeId,
    sourceColumn,
    targetColumn,
    nodeColumnsById,
    nodeDepthMap,
    label,
  } = params;

  if (!sourceNodeId || !targetNodeId) return null;

  const srcHandle = normalizeHandleId(sourceColumn);
  const tgtHandle = normalizeHandleId(targetColumn);

  const srcHas = Boolean(srcHandle && nodeColumnsById.get(sourceNodeId)?.has(srcHandle));
  const tgtHas = Boolean(tgtHandle && nodeColumnsById.get(targetNodeId)?.has(tgtHandle));

  const srcDepth = nodeDepthMap.get(sourceNodeId) ?? 0;
  const tgtDepth = nodeDepthMap.get(targetNodeId) ?? 0;
  const isLeftToRight = srcDepth <= tgtDepth;

  const edge: Edge = {
    id: `edge-${index}`,
    source: sourceNodeId,
    target: targetNodeId,
    type: "default",
    style: { ...EDGE_STYLE },
    ...EDGE_MARKERS,
  };

  if (srcHas && srcHandle) {
    edge.sourceHandle = `${isLeftToRight ? "s-r" : "s-l"}:${srcHandle}`;
  }
  if (tgtHas && tgtHandle) {
    edge.targetHandle = `${isLeftToRight ? "t-l" : "t-r"}:${tgtHandle}`;
  }

  if (label) {
    edge.label = label;
    edge.labelStyle = {
      fill: "rgb(var(--foreground))",
      fontSize: 10,
      fontWeight: 600,
    };
    edge.labelBgStyle = {
      fill: "rgb(var(--background))",
      fillOpacity: 0.8,
    };
  }

  return edge;
}
