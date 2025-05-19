// components/MiniChart.js
import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

export default function MiniChart({ itemId }) {
  const [data, setData] = useState(null);
  const base = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    fetch(`${base}/prices/${itemId}`)
      .then(res => res.json())
      .then(rows => {
        const labels = rows.map(r => r.timestamp);
        const vals   = rows.map(r => r.data.sellPrice);
        setData({ labels, datasets: [{ data: vals, fill: false }] });
      })
      .catch(() => setData(null));
  }, [itemId]);

  if (!data) return <div className="text-sm text-gray-500">No data</div>;

  return (
    <Line
      data={data}
      options={{
        plugins: { legend: { display: false } },
        responsive: true,
        scales: { x: { display: false }, y: { display: false } }
      }}
    />
  );
}
