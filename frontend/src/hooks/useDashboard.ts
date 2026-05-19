import { useEffect, useState } from "react";
import { DashboardPayload, fetchDashboard } from "../lib/api";

export function useDashboard(refreshMs = 60000) {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      fetchDashboard()
        .then((payload) => {
          if (!active) return;
          setData(payload);
          setError(null);
        })
        .catch((err: Error) => {
          if (!active) return;
          setError(err.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    load();
    const timer = window.setInterval(load, refreshMs);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [refreshMs]);

  return { data, loading, error };
}
