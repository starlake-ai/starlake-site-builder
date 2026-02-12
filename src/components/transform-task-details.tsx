"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import CodeMirror from "@uiw/react-codemirror";
import { sql as sqlLang } from "@codemirror/lang-sql";

type JsonRecord = Record<string, unknown>;

interface TransformTaskDetailsProps {
  taskName: string;
  taskJson: JsonRecord;
}

type TabId = "general" | "attributes" | "sql";

const TAB_LABELS: Record<TabId, string> = {
  general: "General",
  attributes: "Attributes",
  sql: "SQL",
};

export function TransformTaskDetails({
  taskName,
  taskJson,
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

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-md border bg-muted p-1 text-sm">
        {(["general", "attributes", "sql"] as TabId[]).map((tab) => (
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


