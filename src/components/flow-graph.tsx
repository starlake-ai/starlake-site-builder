"use client";

import { SchemaNode } from "@/components/schema-node";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { GRAPH_LAYOUT } from "@/lib/graph-layout";
import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Edge, Node, NodeTypes } from "reactflow";
import ReactFlow, {
  Background,
  Controls,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";

const defaultNodeTypes: NodeTypes = { schemaNode: SchemaNode };

interface FlowGraphProps {
  nodes: Node[];
  edges: Edge[];
  nodeTypes?: NodeTypes;
  title?: string;
}


export function FlowGraph({
  nodes: initialNodes,
  edges: initialEdges,
  nodeTypes = defaultNodeTypes,
  title = "Graph",
}: FlowGraphProps) {
  const [maximized, setMaximized] = useState(false);
  const [fullscreenReady, setFullscreenReady] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  useEffect(() => {
    if (maximized) {
      const timer = setTimeout(() => setFullscreenReady(true), 350);
      return () => {
        clearTimeout(timer);
        setFullscreenReady(false);
      };
    }
    setFullscreenReady(false);
  }, [maximized]);

  const sharedFlowProps = {
    nodes,
    edges,
    nodeTypes,
    onNodesChange,
    onEdgesChange,
    fitView: true,
    minZoom: GRAPH_LAYOUT.MIN_ZOOM,
    maxZoom: GRAPH_LAYOUT.MAX_ZOOM,
    proOptions: { hideAttribution: true } as const,
    style: {
      background: "transparent" as const,
      color: "rgb(var(--foreground))",
    },
  };

  const dotMarker = (
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
  );

  return (
    <>
      <svg
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
        aria-hidden
      >
        {dotMarker}
      </svg>

      {!maximized && (
        <div className="h-[700px] w-full overflow-hidden rounded-3xl border border-border/60 bg-background/50 backdrop-blur-sm shadow-2xl transition-all duration-300 hover:border-border/80 relative">
          <ReactFlow {...sharedFlowProps}>
            <Background />
            <Controls
              showInteractive={false}
              className="bg-background! border-border/50! shadow-xl! rounded-lg overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setMaximized(true)}
                className="react-flow__controls-button react-flow__controls-maximize"
                title={`Maximize ${title.toLowerCase()}`}
                aria-label={`Maximize ${title.toLowerCase()}`}
              >
                <Maximize2 className="size-4" />
              </button>
            </Controls>
          </ReactFlow>
        </div>
      )}

      <Dialog open={maximized} onOpenChange={setMaximized}>
        <DialogContent
          showCloseButton={false}
          className="fixed inset-0 top-0 left-0 right-0 bottom-0 translate-x-0 translate-y-0 w-screen min-w-full h-dvh max-w-none rounded-none border-0 p-0 gap-0 flex flex-col bg-background sm:max-w-none"
          style={
            {
              "--tw-enter-scale": "1",
              "--tw-exit-scale": "1",
            } as React.CSSProperties
          }
        >
          <DialogTitle className="sr-only">
            {title} — full screen
          </DialogTitle>
          <div className="flex items-center justify-between shrink-0 px-4 py-2 border-b border-border/60 bg-muted/30">
            <span className="text-sm font-semibold">
              {title} — full screen
            </span>
            <button
              type="button"
              onClick={() => setMaximized(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Exit full screen"
            >
              <Minimize2 className="size-4" />
              <span>Exit full screen</span>
            </button>
          </div>
          <div className="flex-1 min-h-0 w-full relative">
            <svg
              style={{
                position: "absolute",
                width: 0,
                height: 0,
                overflow: "hidden",
                pointerEvents: "none",
              }}
              aria-hidden
            >
              {dotMarker}
            </svg>
            {fullscreenReady && (
              <ReactFlow {...sharedFlowProps} fitViewOptions={{ padding: 0.2 }}>
                <Background />
                <Controls
                  showInteractive={false}
                  className="bg-background! border-border/50! shadow-xl! rounded-lg overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setMaximized(false)}
                    className="react-flow__controls-button react-flow__controls-maximize"
                    title="Exit full screen"
                    aria-label="Exit full screen"
                  >
                    <Minimize2 className="size-4" />
                  </button>
                </Controls>
              </ReactFlow>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .react-flow__node:focus,
        .react-flow__node:focus-visible,
        .react-flow__node.selected,
        .react-flow__node-default.selectable:focus,
        .react-flow__node-default.selectable.selected {
          outline: none !important;
          box-shadow: none !important;
        }
        .react-flow__controls-button.react-flow__controls-maximize svg {
          color: #111 !important;
          stroke: #111 !important;
          fill: none !important;
        }
      `}</style>
    </>
  );
}
