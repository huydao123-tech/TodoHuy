export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    // Nếu truy cập qua IP mạng LAN (ví dụ trên điện thoại) hoặc localhost
    return `http://${window.location.hostname}:8080`;
  }
  return "http://localhost:8080";
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("weekloop_token");
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("weekloop_token", token);
  }
}

export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("weekloop_token");
    localStorage.removeItem("weekloop_user");
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const baseUrl = getBaseUrl();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal || (AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined),
    });
  } catch (err: any) {
    if (err?.name === "TimeoutError" || err?.name === "AbortError") {
      throw new Error("Quá thời gian kết nối (Timeout). Vui lòng kiểm tra xem Backend đã khởi động chưa!");
    }
    throw new Error(`Không thể kết nối đến Backend (${baseUrl}). Hãy đảm bảo Backend Spring Boot (port 8080) đang chạy!`);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      !endpoint.startsWith("/api/auth/") &&
      window.location.pathname !== "/login" &&
      (endpoint === "/api/dashboard" || endpoint === "/api/auth/me")
    ) {
      removeAuthToken();
      window.location.href = "/login";
    }
    throw new Error(errorBody.message || `API error: ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ─── AUTH APIs ─────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; id: number; fullName: string; email: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (fullName: string, email: string, password: string) =>
    apiFetch<{ token: string; id: number; fullName: string; email: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName, email, password }),
    }),

  getProfile: () =>
    apiFetch<{ id: number; fullName: string; email: string }>("/api/auth/me"),
};

// ─── DASHBOARD APIs ────────────────────────────────────────────────────────
export interface DashboardData {
  currentWeekStart: string;
  prevWeekStart: string;
  nextWeekStart: string;
  taskGroups: { id: number; name: string; type: "MAIN" | "SIDE"; displayOrder: number; isArchived: boolean }[];
  weeklyGoals: { id: number; taskGroupId: number; weekStartDate: string; goalText: string }[];
  workItems: { id: number; taskGroupId: number; weekStartDate: string; content: string; status: "TODO" | "IN_PROGRESS" | "DONE"; note: string }[];
  sideTasks: { id: number; name: string; isDone: boolean }[];
  sideTasksDoneCount: number;
  sideTasksTotalCount: number;
}

export const dashboardApi = {
  getDashboard: (weekStart?: string) =>
    apiFetch<DashboardData>(`/api/dashboard${weekStart ? `?weekStart=${weekStart}` : ""}`),
};

// ─── TASK GROUP APIs ───────────────────────────────────────────────────────
export const taskGroupApi = {
  getAll: (type?: "MAIN" | "SIDE") =>
    apiFetch<{ id: number; name: string; type: string; displayOrder: number }[]>(
      `/api/task-groups${type ? `?type=${type}` : ""}`
    ),

  create: (name: string, type: "MAIN" | "SIDE" = "MAIN", displayOrder: number = 0) =>
    apiFetch<{ id: number; name: string; type: string; displayOrder: number }>("/api/task-groups", {
      method: "POST",
      body: JSON.stringify({ name, type, displayOrder }),
    }),

  update: (id: number, name: string) =>
    apiFetch(`/api/task-groups/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    }),

  delete: (id: number) =>
    apiFetch(`/api/task-groups/${id}`, {
      method: "DELETE",
    }),

  getTrash: () =>
    apiFetch<{ id: number; name: string; type: string; displayOrder: number; isArchived: boolean }[]>("/api/task-groups/trash"),

  restore: (id: number) =>
    apiFetch<{ id: number; name: string; type: string; displayOrder: number; isArchived: boolean }>(`/api/task-groups/${id}/restore`, {
      method: "PATCH",
    }),

  permanentDelete: (id: number) =>
    apiFetch<void>(`/api/task-groups/${id}/permanent`, {
      method: "DELETE",
    }),
};

export interface NoteData { id: number; title: string; content: string; color: string; updatedAt: string; }
export const noteApi = {
  getAll: () => apiFetch<NoteData[]>("/api/notes"),
  create: (title: string, content = "", color = "stone") =>
    apiFetch<NoteData>("/api/notes", { method: "POST", body: JSON.stringify({ title, content, color }) }),
  update: (id: number, data: Partial<Pick<NoteData, "title" | "content" | "color">>) =>
    apiFetch<NoteData>(`/api/notes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<void>(`/api/notes/${id}`, { method: "DELETE" }),
};

// ─── RESOURCE APIs ─────────────────────────────────────────────────────────
export const resourceApi = {
  getAll: (groupId?: number) =>
    apiFetch<{ id: number; taskGroupId: number | null; title: string; link: string; description: string }[]>(
      `/api/resources${groupId ? `?groupId=${groupId}` : ""}`
    ),

  create: (title: string, link?: string, description?: string, taskGroupId?: number) =>
    apiFetch<{ id: number; taskGroupId: number | null; title: string; link: string; description: string }>("/api/resources", {
      method: "POST",
      body: JSON.stringify({ title, link, description, taskGroupId }),
    }),

  delete: (id: number) =>
    apiFetch(`/api/resources/${id}`, {
      method: "DELETE",
    }),
};

// ─── WEEKLY GOAL APIs ──────────────────────────────────────────────────────
export const weeklyGoalApi = {
  update: (taskGroupId: number, weekStart: string, goalText: string) =>
    apiFetch(`/api/task-groups/${taskGroupId}/weekly-goals/${weekStart}`, {
      method: "PUT",
      body: JSON.stringify({ goalText }),
    }),
};

// ─── WORK ITEM APIs ────────────────────────────────────────────────────────
export const workItemApi = {
  create: (taskGroupId: number, weekStartDate: string, content: string, note?: string) =>
    apiFetch("/api/work-items", {
      method: "POST",
      body: JSON.stringify({ taskGroupId, weekStartDate, content, status: "TODO", note }),
    }),

  update: (id: number, data: { content?: string; status?: "TODO" | "IN_PROGRESS" | "DONE"; note?: string }) =>
    apiFetch(`/api/work-items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiFetch(`/api/work-items/${id}`, {
      method: "DELETE",
    }),
};

// ─── SIDE TASK APIs ────────────────────────────────────────────────────────
export const sideTaskApi = {
  getAll: (isDone?: boolean) =>
    apiFetch<{ id: number; name: string; isDone: boolean }[]>(
      `/api/side-tasks${isDone !== undefined ? `?isDone=${isDone}` : ""}`
    ),

  create: (name: string) =>
    apiFetch<{ id: number; name: string; isDone: boolean }>("/api/side-tasks", {
      method: "POST",
      body: JSON.stringify({ name, isDone: false }),
    }),

  toggle: (id: number) =>
    apiFetch<{ id: number; name: string; isDone: boolean }>(`/api/side-tasks/${id}/toggle`, {
      method: "PATCH",
    }),

  delete: (id: number) =>
    apiFetch(`/api/side-tasks/${id}`, {
      method: "DELETE",
    }),
};
