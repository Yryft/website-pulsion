import { getAllItems } from "../../lib/items";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart, Line,
  XAxis, YAxis, Tooltip
} from "recharts";
import { useEffect, useState } from "react";

export async function getStaticPaths() {
  const items = getAllItems();
  return {
    paths: items.map(item => ({ params: { id: item.id } })),
    fallback: false
  };
}

export async function getStaticProps({ params }) {
  // Preload the pretty name at build time
  const prettyName = getAllItems().find(i => i.id === params.id).name;
  return {
    props: { id: params.id, prettyName },
    revalidate: 60
  };
}

export default function ItemPage({ id, prettyName }) {
  const [history, setHistory] = useState([]);
  const [soldData, setSoldData] = useState(null);
  const api = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    // 1) Fetch time-series prices
    axios
      .get(`${api}/prices/${id}?range=1week`)
      .then(res => {
        setHistory(res.data.map(p => ({
          time: new Date(p.timestamp).toLocaleTimeString(),
          price: p.price
        })));
      })
      .catch(() => {
        setHistory([]);
      });

    // 2) Fetch sold volume over the same period
    axios
      .get(`${api}/sold/${id}?range=1week`)
      .then(res => {
        setSoldData(res.data);
      })
      .catch(() => {
        setSoldData(null);
      });
  }, [id]);

  return (
    <main className="p-8 max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">{prettyName}</h1>

      {/* Price history chart */}
      <section>
        <h2 className="text-xl mb-2">Price History (last 7 days)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={history}>
            <XAxis dataKey="time" />
            <YAxis domain={['auto','auto']} />
            <Tooltip />
            <Line dataKey="price" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Sold volume summary */}
      {soldData && (
        <section>
          <h2 className="text-xl mb-2">Sold Volume (last 7 days)</h2>
          <p className="text-lg">
            {soldData.sold.toLocaleString()} units sold from{' '}
            {new Date(soldData.from).toLocaleDateString()} to{' '}
            {new Date(soldData.to).toLocaleDateString()}.
          </p>
        </section>
      )}
    </main>
  );
}
