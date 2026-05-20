const apiBaseInput = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api/v1";
const API_BASE = apiBaseInput.replace(/\/$/, "");

export type Article = {
  id: number;
  title: string;
  source: string;
  author: string | null;
  url: string;
  image_url: string | null;
  published_at: string;
  category: string;
  tags: string[];
  excerpt: string | null;
  short_summary: string[];
  overview: string | null;
  key_takeaways: string[];
  sentiment_score: number;
  sentiment_label: "bullish" | "bearish" | "neutral";
  cluster_key: string | null;
  related_tickers: string[];
};

export type DashboardPayload = {
  today: Article[];
  yesterday: Article[];
  weekly: Article[];
  monthly: Article[];
  trending_topics: Array<{ topic: string; count: number; sentiment: string; sources: string[] }>;
  sentiment_breakdown: Record<string, number>;
  movers: Array<{ name: string; price: number; change: number }>;
};

export async function fetchDashboard(): Promise<DashboardPayload> {
  const response = await fetch(`${API_BASE}/dashboard`);
  if (!response.ok) {
    throw new Error("Unable to load dashboard");
  }
  return response.json();
}

export async function fetchNews(query = "", category = ""): Promise<Article[]> {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (category) params.set("category", category);
  const response = await fetch(`${API_BASE}/news?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Unable to load articles");
  }
  return response.json();
}

export async function triggerIngestion(): Promise<void> {
  await fetch(`${API_BASE}/ingest/run`, { method: "POST" });
}
