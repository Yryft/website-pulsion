import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function MiniChart({ itemId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const base = process.env.NEXT_PUBLIC_API_BASE || "https://pulsion-apiv1.up.railway.app";

  useEffect(() => {
    let attempts = 0;
    let cancelled = false;

    async function fetchDataWithRetry() {
      while (attempts < 10 && !cancelled) {
        try {
          const res = await fetch(`${base}/prices/${itemId}`);
          if (!res.ok) throw new Error("Network error");
          const rows = await res.json();
          if (!Array.isArray(rows) || rows.length === 0) throw new Error("No valid data");

          const labels = rows.map(r => new Date(r.timestamp).toLocaleTimeString());
          const sellPrices = rows.map(r => Math.round(r.data.sellPrice));
          const buyPrices = rows.map(r => Math.round(r.data.buyPrice));

          if (!cancelled) {
            setData({
              labels,
              datasets: [
                {
                  label: 'Sell Price',
                  data: sellPrices,
                  fill: false,
                  tension: 0.4,
                  borderWidth: 3,
                  borderColor: 'rgb(75,192,192)',
                  pointRadius: 0.05,
                  pointHoverRadius: 4,
                  pointBackgroundColor: 'rgb(75,192,192)'
                },
                {
                  label: 'Buy Price',
                  data: buyPrices,
                  fill: false,
                  tension: 0.4,
                  borderWidth: 3,
                  borderColor: 'rgb(255,99,132)',
                  pointRadius: 0.05,
                  pointHoverRadius: 4,
                  pointBackgroundColor: 'rgb(255,99,132)'
                }
              ]
            });
            setLoading(false);
            return;
          }
        } catch (err) {
          attempts++;
          await new Promise(res => setTimeout(res, 500)); // wait 500ms before retry
        }
      }

      if (!cancelled) {
        setLoading(false);
        setData(null);
      }
    }

    fetchDataWithRetry();

    return () => {
      cancelled = true;
    };
  }, [itemId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <svg className="animate-spin h-5 w-5 text-gray-500 dark:text-gray-300" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      </div>
    );
  }

  if (!data) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">No data</div>;
  }

  return (
    <div className="h-full w-full bg-blue-100 dark:bg-gray-800 rounded">
      <Line
        data={data}
        options={{
          plugins: {
            legend: {
              display: true,
              labels: {
                font: {
                  size: 12
                },
                boxWidth: 2,
                boxHeight: 2,
                padding: 6
              }
            }
          },
          responsive: true,
          scales: {
            x: { display: false },
            y: { display: false }
          },
          animation: false,
          elements: {
            line: {
              borderJoinStyle: 'round',
              borderCapStyle: 'round'
            }
          }
        }}
      />
    </div>
  );
}
