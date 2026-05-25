import axios, { type AxiosError } from "axios";

export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 60_000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("sa_token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("sa_token");
      localStorage.removeItem("sa_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default apiClient;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    apiClient.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    apiClient.post("/auth/login", data),
  me: () => apiClient.get("/auth/me"),
};

// ── Analyze ───────────────────────────────────────────────────────────────────
export const analyzeAPI = {
  single: (text: string, model = "vader") =>
    apiClient.post("/analyze", { text, model }),
  batch: (texts: string[], model = "vader") =>
    apiClient.post("/analyze/batch", { texts, model }),
  batchCsv: (file: File, column = "text", model = "vader") => {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post(`/analyze/batch/csv?column=${encodeURIComponent(column)}&model=${model}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  exportBatchCsv: () =>
    apiClient.get("/analyze/batch/csv/export", { responseType: "blob" }),
  keywords: (days = 30, limit = 20) =>
    apiClient.get("/analyze/keywords", { params: { days, limit } }),
  public: (text: string) => apiClient.post("/analyze/public", { text }),
};

// ── History ───────────────────────────────────────────────────────────────────
export const historyAPI = {
  tweetsByDate: (date: string, limit = 200) =>
    apiClient.get("/history/tweets-by-date", { params: { date, limit } }),
  keywordsTrend: (days = 30, top = 10) =>
    apiClient.get("/history/keywords-trend", { params: { days, top } }),
  get: (params: {

    sentiment?: string;
    search?: string;
    page?: number;
    limit?: number;
    date_from?: string;
    date_to?: string;
  }) => apiClient.get("/history", { params }),
  stats: () => apiClient.get("/history/stats"),
  analytics: (days = 30) => apiClient.get("/history/analytics", { params: { days } }),
  exportCsv: () => apiClient.get("/history/export/csv", { responseType: "blob" }),
  delete: (id: string) => apiClient.delete(`/history/${id}`),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  data: () => apiClient.get("/admin/data"),
  history: (page = 1, limit = 20) =>
    apiClient.get("/admin/history", { params: { page, limit } }),
  trends: () => apiClient.get("/admin/trends"),
};

// ── Insights ──────────────────────────────────────────────────────────────────
export const insightsAPI = {
  get: (params: { days?: number }) => apiClient.get("/insights", { params }),
  explain: (historyId: string) => apiClient.get(`/insights/explain/${historyId}`),
};

export const emotionsAPI = {
  get: (days = 30, limit = 5000) => apiClient.get("/emotions", { params: { days, limit } }),
};


// ── Export ────────────────────────────────────────────────────────────────────
export const exportAPI = {
  pdfReport: (title = "Sentiment Report") =>
    apiClient.get(`/export/report/pdf?title=${encodeURIComponent(title)}`, { responseType: "blob" }),
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatAPI = {
  createConversation: (title = "New Chat") =>
    apiClient.post("/conversations", { title }),
  getConversations: (search = "") =>
    apiClient.get(`/conversations?search=${encodeURIComponent(search)}`),
  getMessages: (conversationId: string) =>
    apiClient.get(`/conversations/${conversationId}/messages`),
  deleteConversation: (conversationId: string) =>
    apiClient.delete(`/conversations/${conversationId}`),
  clearChat: (conversationId: string) =>
    apiClient.delete(`/chat/clear/${conversationId}`),
  // chatbot endpoints removed
};

