import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";

function getTasksDir(): string | null {
  const base = process.env.TPCH_BASE_PATH;
  if (!base) return null;
  return path.join(base, "tasks");
}

export interface TaskInfo {
  name: string;
  filePath: string;
}

export interface TransformDomainInfo {
  name: string;
  tasks: TaskInfo[];
}

interface TasksJsonItem {
  name?: string;
  [key: string]: unknown;
}

/**
 * Read domains from tasks/tasks.json and discover tasks from files named {domain}.{task}.json.
 */
export function getTransformDomains(): TransformDomainInfo[] {
  const tasksDir = getTasksDir();
  if (!tasksDir || !existsSync(tasksDir)) {
    if (!process.env.TPCH_BASE_PATH) {
      console.warn("TPCH_BASE_PATH environment variable is not set");
    } else {
      console.warn(`TPCH tasks directory not found: ${tasksDir}`);
    }
    return [];
  }

  const tasksJsonPath = path.join(tasksDir, "tasks.json");
  if (!existsSync(tasksJsonPath)) {
    console.warn(`TPCH tasks.json not found: ${tasksJsonPath}`);
    return [];
  }

  let domainNames: string[] = [];
  try {
    const raw = readFileSync(tasksJsonPath, "utf-8");
    const data = JSON.parse(raw) as TasksJsonItem[] | TasksJsonItem;
    const list = Array.isArray(data) ? data : [data];
    domainNames = list
      .map((item) => item.name)
      .filter((n): n is string => typeof n === "string");
  } catch (e) {
    console.warn("Failed to parse tasks.json:", e);
    return [];
  }

  const files = readdirSync(tasksDir);
  const result: TransformDomainInfo[] = domainNames.map((domainName) => {
    const prefix = `${domainName}.`;
    const suffix = ".json";
    const taskFiles = files.filter(
      (f) =>
        f !== "tasks.json" &&
        f.startsWith(prefix) &&
        f.endsWith(suffix) &&
        f.length > prefix.length + suffix.length
    );
    const tasks: TaskInfo[] = taskFiles.map((f) => {
      const base = f.slice(0, -suffix.length);
      const taskName = base.slice(prefix.length);
      return {
        name: taskName,
        filePath: path.join(tasksDir, f),
      };
    });
    return { name: domainName, tasks };
  });

  return result;
}

/**
 * Get a single transform domain by name, or null if not found.
 */
export function getTransformDomain(
  domainName: string
): TransformDomainInfo | null {
  const domains = getTransformDomains();
  return domains.find((d) => d.name === domainName) ?? null;
}

/**
 * Get raw task JSON content for a domain task. Returns null if file not found or invalid.
 */
export function getTaskJson(
  domainName: string,
  taskName: string
): Record<string, unknown> | null {
  const domain = getTransformDomain(domainName);
  if (!domain) return null;
  const task = domain.tasks.find((t) => t.name === taskName);
  if (!task || !existsSync(task.filePath)) return null;
  try {
    const raw = readFileSync(task.filePath, "utf-8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}
