// components/MiniChart.js
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

// 1) Register the scales & elements
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
  const base = process.env.NEXT_PUBLIC_API_BASE || "https://pulsion-apiv1.up.railway.app";

  useEffect(() => {
    fetch(`${base}/prices/${itemId}`)
      .then(r => r.json())
      .then(rows => {
        const labels = rows.map(r => new Date(r.timestamp).toLocaleTimeString());
        const sellPrices   = rows.map(r => Math.round(r.data.sellPrice));
        const buyPrices    = rows.map(r => Math.round(r.data.buyPrice));
        setData({
          labels,
          datasets: [{
            label: 'Sell Price',
            data: sellPrices,
            fill: false,
            tension: 0.4,           // <— smooth bezier curves
            borderWidth: 3,         // a bit thicker for clarity
            borderColor: 'rgb(75,192,192)',
            pointRadius: 0.05,         // hide the individual dots
            pointHoverRadius: 4,  // but show a dot on hover
            pointBackgroundColor: 'rgb(75,192,192)'
          },
          {
            label: 'Buy Price',
            data: buyPrices,
            fill: false,
            tension: 0.4,
            borderWidth: 3,
            borderColor: 'rgb(255,99,132)',       // contrasting red
            pointRadius: 0.05,
            pointHoverRadius: 4,
            pointBackgroundColor: 'rgb(255,99,132)' // same for dots
          }]
        });
      })
      .catch(() => setData(null));
  }, [itemId]);

  if (!data) return <div className="text-sm text-gray-500 dark:text-gray-400">No data</div>;

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
                  size: 12        // smaller font
                },
                boxWidth: 2,     // smaller color box
                boxHeight: 2,    // match boxWidth if you like
                padding: 6       // space between legend items
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
              borderCapStyle: 'round',
            }
          }

        }}
      />
    </div>
  );
}
