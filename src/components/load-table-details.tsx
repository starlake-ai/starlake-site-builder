"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type JsonRecord = Record<string, unknown>;

interface TableDetailsProps {
  tableName: string;
  tableJson: JsonRecord;
}

type TabId = "general" | "attributes";

const TAB_LABELS: Record<TabId, string> = {
  general: "General",
  attributes: "Attributes",
};

export function TableDetails({ tableName, tableJson }: TableDetailsProps) {
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

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-md border bg-muted p-1 text-sm">
        {(["general", "attributes"] as TabId[]).map((tab) => (
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

