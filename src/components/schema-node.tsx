"use client";

import { useState } from "react";
import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import { cn } from "@/lib/utils";

export interface SchemaColumnInfo {
  name: string;
  primaryKey?: boolean;
  foreignKey?: boolean;
}

export interface SchemaNodeData {
  domain: string;
  table: string;
  columns: SchemaColumnInfo[];
}

export function normalizeHandleId(value?: string): string {
  return (value ?? "").trim();
}

export function SchemaNode({ data }: NodeProps<SchemaNodeData>) {
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);

  return (
    <div className="min-w-64 overflow-hidden rounded-lg shadow-lg border-0 bg-[#f5f5f5] dark:bg-card">
      <div className="relative border-b-2 border-primary bg-primary px-4 py-3 dark:border-muted dark:bg-muted">
        <div className="text-center text-[11px] font-bold uppercase tracking-wider text-primary-foreground/80 dark:text-muted-foreground">
          {data.domain}
        </div>
        <div className="text-center text-[15px] font-extrabold text-primary-foreground dark:text-foreground mt-0.5">
          {data.table}
        </div>
      </div>
      <div className="bg-[#f5f5f5] dark:bg-card">
        {data.columns.map((col, rowIndex) => {
          const column = col.name;
          const isHovered = hoveredCol === column;
          const handleId = normalizeHandleId(column);
          return (
            <div
              key={`${data.domain}.${data.table}.${column}`}
              onMouseEnter={() => setHoveredCol(column)}
              onMouseLeave={() => setHoveredCol(null)}
              className={cn(
                "relative px-4 py-2 text-left text-[13px] font-medium transition-colors",
                isHovered && "bg-primary/10 dark:bg-primary/20",
                !isHovered &&
                  (rowIndex % 2 === 0
                    ? "bg-[#eee] dark:bg-card hover:bg-black/5 dark:hover:bg-white/5"
                    : "bg-[#dfdcdc] dark:bg-muted/30 hover:bg-black/5 dark:hover:bg-white/5")
              )}
              style={{ color: "var(--node-text-color)" }}
            >
              <Handle
                type="target"
                position={Position.Left}
                id={`t-l:${handleId}`}
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
                id={`s-r:${handleId}`}
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
                id={`s-l:${handleId}`}
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
                id={`t-r:${handleId}`}
                style={{
                  right: -5,
                  width: 1,
                  height: 1,
                  opacity: 0,
                  border: "none",
                }}
              />
              <span className="text-[#444] dark:text-foreground">{column}</span>
              {col.primaryKey && (
                <span
                  className="ml-2 text-[10px] font-bold text-muted-foreground"
                  title="Primary Key"
                >
                  PK
                </span>
              )}
              {col.foreignKey && (
                <span
                  className="ml-1 text-[10px] font-bold text-muted-foreground"
                  title="Foreign Key"
                >
                  FK
                </span>
              )}
            </div>
          );
        })}
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
