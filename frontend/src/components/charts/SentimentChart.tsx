import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export function SentimentChart({ breakdown }: { breakdown: Record<string, number> }) {
  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Market Sentiment</p>
          <h3 className="font-display text-xl text-white">Cross-market posture</h3>
        </div>
      </div>
      <div className="mx-auto max-w-[240px]">
        <Doughnut
          data={{
            labels: ["Bullish", "Neutral", "Bearish"],
            datasets: [
              {
                data: [breakdown.bullish ?? 0, breakdown.neutral ?? 0, breakdown.bearish ?? 0],
                backgroundColor: ["#34d399", "#7dd3fc", "#fb7185"],
                borderColor: ["#0f1726"],
                borderWidth: 3,
              },
            ],
          }}
          options={{
            plugins: {
              legend: {
                labels: {
                  color: "#cbd5e1",
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}

