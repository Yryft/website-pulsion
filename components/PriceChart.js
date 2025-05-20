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

        <Tooltip
          contentStyle={{
            backgroundColor:
              typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
                ? '#1f2937'
                : '#ffffff',
            color:
              typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
                ? '#ffffff'
                : '#000000',
            border: '1px solid #ccc',
          }}
          formatter={(value, name) => [
            typeof value === 'number' ? value.toLocaleString() : value,
            name
          ]}
          labelStyle={{ color: '#888' }}
        />

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
