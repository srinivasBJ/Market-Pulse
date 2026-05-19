import { useEffect, useState } from "react";
import { Article, fetchNews } from "../lib/api";

export function useNewsSearch(query: string, category: string) {
  const [results, setResults] = useState<Article[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchNews(query, category).then(setResults).catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(timeout);
  }, [query, category]);

  return results;
}

