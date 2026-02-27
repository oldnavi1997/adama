const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

type RequestOptions = RequestInit & { auth?: boolean; _retry?: boolean };
type ApiValidationIssue = { path?: Array<string | number>; message?: string };

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("admin_refreshToken");
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { accessToken: string };
    localStorage.setItem("admin_accessToken", data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem("admin_accessToken");
  localStorage.removeItem("admin_refreshToken");
}

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

  if (response.status === 401 && options.auth && !options._retry) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
    }
    const newToken = await refreshPromise;
    if (newToken) {
      return api<T>(path, { ...options, _retry: true });
    }
    clearSession();
    window.location.href = "/login";
    throw new Error("Sesión expirada");
  }

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
