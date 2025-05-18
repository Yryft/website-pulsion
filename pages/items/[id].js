import Link from "next/link";
import { useRouter } from "next/router";
import { getAllItems } from "../../lib/items";
import { renderNameWithColors } from "../../lib/renderName";
import {
  ResponsiveContainer,
  LineChart, Line,
  XAxis, YAxis, Tooltip,
  ReferenceLine, Label
} from "recharts";
import { useEffect, useState, useRef } from "react";

export async function getServerSideProps({ params }) {
  const base = process.env.API_BASE || "https://pulsion-apiv1.up.railway.app";

  const items = await getAllItems();
  const item = items.find(i => i.id === params.id);
  if (!item) return { notFound: true };

  const [pricesRes, soldRes, electionsRes] = await Promise.all([
    fetch(`${base}/prices/${params.id}?range=all`),
    fetch(`${base}/sold/${params.id}?range=1day`),
    fetch(`${base}/elections?range=all`)
  ]);

  const historyRaw = pricesRes.ok ? await pricesRes.json() : [];
  const soldData = soldRes.ok ? await soldRes.json() : null;
  const elections = electionsRes.ok ? await electionsRes.json() : [];

  const history = historyRaw.map(p => {
    const tms = new Date(p.timestamp).getTime();
    const mayor = elections
      .slice()
      .reverse()
      .find(e => new Date(e.timestamp).getTime() <= tms);

    return {
      time: new Date(p.timestamp).toLocaleTimeString(),
      tms,
      price: Math.round(p.price.sellPrice),
      mayor: mayor ? `${mayor.mayor} (${mayor.year})` : null
    };
  });

  const electionLines = elections.map(e => ({
    tms: new Date(e.timestamp).getTime(),
    label: `${e.mayor} (${e.year})`
  }));

  return {
    props: { id: item.id, prettyName: item.name, history, soldData, electionLines }
  };
}

export default function ItemPage({ id, prettyName, history, soldData }) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    getAllItems().then(setAllItems);
  }, []);

  const suggestions = query
    ? allItems
        .filter(({ name }) =>
          name.toLowerCase().includes(query.trim().toLowerCase())
        )
        .slice(0, 10)
    : [];

  useEffect(() => {
    function handler(e) {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const isUltimate = id.startsWith("ULTIMATE_");

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Autocomplete */}
      <div className="relative" ref={inputRef}>
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder="Search items…"
          className="
            w-full p-2 border rounded
            bg-white text-black placeholder-gray-500
            dark:bg-gray-800 dark:text-white dark:placeholder-gray-400
          "
        />
        {open && suggestions.length > 0 && (
          <ul className="
            absolute z-10 mt-1 w-full
            bg-white text-black
            dark:bg-gray-800 dark:text-white
            border rounded shadow max-h-60 overflow-auto
          ">
            {suggestions.map(({ id, name }) => (
              <li
                key={id}
                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => {
                  setOpen(false);
                  router.push(`/items/${id}`);
                }}
              >
                {renderNameWithColors(name, id)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Back */}
      <Link
        href="/"
        className="
          inline-block mb-4 px-3 py-1 rounded
          bg-gray-200 text-black hover:bg-gray-300
          dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600
        "
      >
        ← Back to Home
      </Link>

      {/* Title */}
      <h1 className="text-2xl font-bold">
        {renderNameWithColors(prettyName, id)}
      </h1>

      {/* Price Chart */}
      <section className="w-full overflow-x-auto">
        <h2 className="text-xl mb-2">Price History</h2>
        {history.length > 0 ? (
          <div className="min-w-[1000px] h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={history}
                margin={{ top: 30, right: 80, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="tms"
                  type="number"
                  domain={['auto', 'auto']}
                  tickFormatter={(tms) =>
                    new Date(tms).toLocaleTimeString()
                  }
                  stroke="#8884d8"
                />
                <YAxis
                  stroke="#8884d8"
                  tickFormatter={(value) => value.toLocaleString()}
                  allowDataOverflow={true}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tw-bg-opacity, 1)',
                    color: 'inherit',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                  }}
                  labelFormatter={(tms) =>
                    new Date(tms).toLocaleTimeString()
                  }
                  formatter={(value, name, props) => {
                    const mayor = props.payload.mayor;
                    const nameWithMayor = mayor ? `${name} — ${mayor}` : name;
                    return [value.toLocaleString(), nameWithMayor];
                  }}

                />
                <Line dataKey="price" dot={false} stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No price history available.</p>
        )}
      </section>

      {/* Sold volume */}
      <section>
        <h2 className="text-xl mb-2">Sold Volume (last 24 h)</h2>
        {soldData ? (
          <p>
            <strong>{soldData.sold.toLocaleString()}</strong> units sold from{" "}
            {new Date(soldData.from).toLocaleTimeString()} to{" "}
            {new Date(soldData.to).toLocaleTimeString()}.
          </p>
        ) : (
          <p>No sold-volume data available for the past day.</p>
        )}
      </section>
    </main>
  );
}
