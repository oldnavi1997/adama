const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

type RequestOptions = RequestInit & { auth?: boolean };
type ApiValidationIssue = { path?: Array<string | number>; message?: string };

function formatApiError(payload: unknown, fallbackStatus: number): string {
  if (!payload || typeof payload !== "object") {
    return `HTTP ${fallbackStatus}`;
  }

  const record = payload as { message?: unknown; issues?: unknown };
  const message = typeof record.message === "string" ? record.message : `HTTP ${fallbackStatus}`;
  const issues = Array.isArray(record.issues) ? (record.issues as ApiValidationIssue[]) : [];

  if (issues.length === 0) {
    return message;
  }

  const formattedIssues = issues
    .map((issue) => {
      const field = issue.path?.[0];
      const fieldName = typeof field === "string" ? field : "campo";
      return `${fieldName}: ${issue.message ?? "valor invalido"}`;
    })
    .join("\n");

  return `${message}\n${formattedIssues}`;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem("admin_accessToken");
  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (options.auth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as unknown;
      throw new Error(formatApiError(payload, response.status));
    }

    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }

  const responseText = await response.text();
  if (!responseText) {
    return undefined as T;
  }

  return JSON.parse(responseText) as T;
}
