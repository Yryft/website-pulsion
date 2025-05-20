import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

// 1) Create a small functional component:
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-gray-200 dark:bg-gray-700 border border-gray-500 dark:border-gray-600 text-gray-800 dark:text-gray-100 p-2 rounded-md">
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm">
          <span className="font-semibold">{entry.name}:</span>{' '}
          {typeof entry.value === 'number'
            ? entry.value.toLocaleString()
            : entry.value}
        </p>
      ))}
    </div>
  );
}

export function PriceChart({ data, annotations }) {
  const tooMany = data.length > 50;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 30, right: 60, left: 40, bottom: 0 }}>
        <defs>
          <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorSell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
          </linearGradient>
        </defs>

        <XAxis
          dataKey="displayTime"
          tickFormatter={(val) => {
            const d = new Date(val);
            return tooMany
              ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          }}
          interval="preserveStartEnd"
          tick={{ fontSize: 12 }}
        />

        <YAxis
          tickFormatter={(v) => (typeof v === 'number' ? v.toLocaleString() : v)}
        />

        <CartesianGrid strokeDasharray="3 3" stroke="#999" strokeOpacity={0.3} />

        <Tooltip content={<CustomTooltip />} />

        <Legend/>

        <Area
          type="monotone"
          dataKey="data.buyPrice"
          name="Buy Price"
          stroke="#82ca9d"
          fill="url(#colorBuy)"
        />
        <Area
          type="monotone"
          dataKey="data.sellPrice"
          name="Sell Price"
          stroke="#8884d8"
          fill="url(#colorSell)"
        />

        {annotations.map((a,i) => (
          <ReferenceLine
            key={i}
            x={a.displayTime}
            stroke="#ff7f7f"
            strokeOpacity={0.2}
            strokeWidth={1}
            strokeDasharray="3 3"
            label={{
              value: `${a.mayor}-${a.year}`,
              position: 'bottom',
              offset: 25,
              fontSize: 10,
              fill: 'rgba(232, 232, 232, 0.5)'
            }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
