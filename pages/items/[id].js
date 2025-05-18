import { getAllItems } from "../../lib/items";
import { renderNameWithColors } from "../../lib/renderName";
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
    paths: items.map(({ id }) => ({ params: { id } })),
    fallback: false
  };
}

export async function getStaticProps({ params }) {
  const prettyName = getAllItems()
    .find(i => i.id === params.id).name;
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
    axios.get(`${api}/prices/${id}?range=1week`)
      .then(({ data }) =>
        setHistory(data.map(p => ({
          time: new Date(p.timestamp).toLocaleTimeString(),
          price: p.price
        })))
      )
      .catch(() => setHistory([]));

    axios.get(`${api}/sold/${id}?range=1week`)
      .then(({ data }) => setSoldData(data))
      .catch(() => setSoldData(null));
  }, [id]);

  // detect Ultimate enchanted books by internal ID
  const isUltimate = id.startsWith("ULTIMATE_");

  return (
    <main className="p-8 max-w-3xl mx-auto space-y-8">
      <h1
        className={`text-2xl font-bold ${
          isUltimate ? "text-pink-500" : ""
        }`}
      >
        {isUltimate
          ? prettyName
          : renderNameWithColors(prettyName)
        }
      </h1>

      <section>
        <h2 className="text-xl mb-2">Price History (last 7 days)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={history}>
            <XAxis dataKey="time" stroke="#8884d8" />
            <YAxis stroke="#8884d8" domain={['auto','auto']} />
            <Tooltip />
            <Line
              dataKey="price"
              dot={false}
              stroke="#8884d8"
            />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {soldData && (
        <section>
          <h2 className="text-xl mb-2">Sold Volume (last 7 days)</h2>
          <p>
            <strong>{soldData.sold.toLocaleString()}</strong>{" "}
            units sold from{" "}
            {new Date(soldData.from).toLocaleDateString()} to{" "}
            {new Date(soldData.to).toLocaleDateString()}.
          </p>
        </section>
      )}
    </main>
  );
}
