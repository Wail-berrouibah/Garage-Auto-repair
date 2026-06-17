const API_BASE = "/api/v1";

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | undefined>;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("auth-storage");
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return parsed.state?.accessToken || null;
  } catch {
    return null;
  }
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("auth-storage");
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return parsed.state?.refreshToken || null;
  } catch {
    return null;
  }
}

function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem("auth-storage");
  if (!stored) return;
  try {
    const parsed = JSON.parse(stored);
    parsed.state.accessToken = accessToken;
    parsed.state.refreshToken = refreshToken;
    localStorage.setItem("auth-storage", JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

function clearAuth(): void {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem("auth-storage");
  if (!stored) return;
  try {
    const parsed = JSON.parse(stored);
    parsed.state.accessToken = null;
    parsed.state.refreshToken = null;
    parsed.state.isAuthenticated = false;
    parsed.state.user = null;
    localStorage.setItem("auth-storage", JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const base = API_BASE.startsWith("/") ? `${window.location.origin}${API_BASE}` : API_BASE;
  const url = new URL(`${base}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    const newAccessToken = data.data?.accessToken || data.accessToken;
    const newRefreshToken = data.data?.refreshToken || data.refreshToken;
    setTokens(newAccessToken, newRefreshToken);
    return true;
  } catch {
    return false;
  }
}

async function performRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(buildUrl(path, options.params), {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: "Request failed" } }));
    throw new ApiError(
      response.status,
      error.error?.code || "UNKNOWN_ERROR",
      error.error?.message || "An unexpected error occurred",
      error.error?.details,
    );
  }

  return response.json();
}

type RetryState = {
  attempted: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const retry: RetryState = { attempted: false };

  while (true) {
    try {
      return await performRequest<T>(path, options);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401 && getRefreshToken() && !retry.attempted) {
        retry.attempted = true;

        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = refreshAccessToken().finally(() => {
            isRefreshing = false;
          });
        }

        const refreshed = refreshPromise ? await refreshPromise : false;
        if (!refreshed) {
          clearAuth();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          throw new ApiError(401, "TOKEN_EXPIRED", "Session expired. Please login again.");
        }

        continue;
      }

      throw error;
    }
  }
}

export const api = {
  get: <T>(path: string, params?: Record<string, string | number | undefined>) =>
    request<T>(path, { params }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
