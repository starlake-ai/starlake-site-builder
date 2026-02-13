type JsonRecord = Record<string, unknown>;

/**
 * Formats a cell value for display in tables.
 */
export function formatCellValue(value: unknown): string {
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

/**
 * Formats an attribute value for display, handling type/array conventions.
 */
export function formatAttributeValue(key: string, attr: JsonRecord): string {
  const value = attr[key];
  if (key === "type" || key === "columnType") {
    const baseType = formatCellValue(value);
    const isArray = attr.array === true || attr.Array === true;
    return isArray ? `${baseType} [ ]` : baseType;
  }
  return formatCellValue(value);
}

/**
 * Derives column keys from an array of attribute records for table display.
 * Orders columns: name/identifier first, then type, array, rest, then comment last.
 */
export function getAttributeKeys(attributes: JsonRecord[]): string[] {
  if (attributes.length === 0) return [];

  const allKeys = new Set<string>();
  attributes.forEach((attr) =>
    Object.keys(attr ?? {}).forEach((k) => allKeys.add(k))
  );
  const raw = Array.from(allKeys);
  const excludeLower = ["foreignkey", "foreign_key", "description"];
  const toLower = (s: string) => s.toLowerCase();
  let rest = raw.filter((k) => !excludeLower.includes(toLower(k)));
  const typeKey = rest.find(
    (k) => toLower(k) === "type" || toLower(k) === "columntype"
  );
  const arrayKey = rest.find((k) => toLower(k) === "array");
  const commentKey = rest.find((k) => toLower(k) === "comment");
  const hasArray = arrayKey != null;
  const hasComment = commentKey != null;
  rest = rest.filter((k) => k !== arrayKey && k !== commentKey);

  if (typeKey) {
    const idx = rest.indexOf(typeKey);
    if (idx !== -1) {
      rest = [
        ...rest.slice(0, idx + 1),
        ...(hasArray ? [arrayKey!] : []),
        ...rest.slice(idx + 1),
      ];
    } else if (hasArray) {
      rest = [arrayKey!, ...rest];
    }
  } else if (hasArray) {
    rest = [arrayKey!, ...rest];
  }
  return [...rest, ...(hasComment ? [commentKey!] : [])];
}
