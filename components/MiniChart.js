// components/MiniChart.js
import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// Register the scales & components you need:
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
)

export default function MiniChart({ itemId }) {
  const [data, setData] = useState(null)
  const base = process.env.NEXT_PUBLIC_API_BASE

  useEffect(() => {
    fetch(`${base}/prices/${itemId}`)
      .then(r => r.json())
      .then(rows => {
        const labels = rows.map(r => r.timestamp)
        const vals   = rows.map(r => r.data.sellPrice)
        setData({
          labels,
          datasets: [{
            label: 'Sell Price',
            data: vals,
            fill: false,
            borderWidth: 1
          }]
        })
      })
      .catch(() => setData(null))
  }, [itemId])

  if (!data) return <div className="text-sm text-gray-500">No data</div>

  return (
    <Line
      data={data}
      options={{
        plugins: { legend: { display: false } },
        responsive: true,
        scales: {
          x: { display: false },
          y: { display: false }
        }
      }}
    />
  )
}
