// pages/items/[id].js
import Link from "next/link";
import { useRouter } from "next/router";
import { getAllItems } from "../../lib/items";
import { renderNameWithColors } from "../../lib/renderName";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Label
} from "recharts";
import { useEffect, useState, useRef } from "react";
import Head from "next/head";

export async function getServerSideProps({ params }) {
  const base = process.env.API_BASE || "https://pulsion-apiv1.up.railway.app";

  // get the pretty name from your items.json
  const items = await getAllItems();
  const item = items.find(i => i.id === params.id);
  if (!item) return { notFound: true };

  // fetch full price history (all time)
  const [pricesRes, soldRes, electionsRes] = await Promise.all([
    fetch(`${base}/prices/${params.id}?range=all`),
    fetch(`${base}/sold/${params.id}`),
    fetch(`${base}/elections?range=all`)
  ]);

  const historyRaw = pricesRes.ok ? await pricesRes.json() : [];
  const soldData   = soldRes.ok   ? await soldRes.json()   : null;
  const elections  = electionsRes.ok ? await electionsRes.json() : [];

  // remap history to your recharts format
  const history = historyRaw.map(p => {
    const tms = new Date(p.timestamp).getTime();
    const mayor = elections
      .slice().reverse()
      .find(e => new Date(e.timestamp).getTime() <= tms);

    return {
      time: new Date(p.timestamp).toLocaleTimeString(),
      tms,
      // show sellPrice over time
      price: Math.round(p.data.buyPrice),
      mayor: mayor ? `${mayor.mayor} (${mayor.year})` : null
    };
  });

  // election lines remain unchanged
  const electionLines = elections.map(e => ({
    tms: new Date(e.timestamp).getTime(),
    label: `${e.mayor} (${e.year})`
  }));

  return {
    props: {
      id: item.id,
      prettyName: item.name,
      history,
      soldData,
      electionLines
    }
  };
}

export default function ItemPage({ id, prettyName, history, soldData, electionLines }) {
  const router = useRouter();

  // Autocomplete state (unchanged)
  const [query, setQuery]     = useState("");
  const [allItems, setAllItems] = useState([]);
  const [open, setOpen]       = useState(false);
  const inputRef              = useRef();

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

  return (
    <>
    <Head>
      <title>{prettyName} | Bazaar Tracker</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>
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
          className="w-full p-2 border rounded"
        />
        {open && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full border rounded shadow max-h-60 overflow-auto bg-white">
            {suggestions.map(({ id, name }) => (
              <li
                key={id}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
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
      <Link href="/" className="inline-block mb-4 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">
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
              <LineChart data={history} margin={{ top: 30, right: 80, left: 60, bottom: 0 }}>
                <XAxis
                  dataKey="tms"
                  type="number"
                  domain={['auto', 'auto']}
                  tickFormatter={t => new Date(t).toLocaleTimeString()}
                />
                <YAxis
                  tickFormatter={v => v.toLocaleString()}
                  allowDataOverflow
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const { mayor } = payload[0].payload;
                    const date = new Date(label).toLocaleString();
                    const price = payload[0].value.toLocaleString();
                    return (
                      <div style={{ padding: 8, background: '#fff', border: '1px solid #ccc' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                          {mayor ? `${mayor} — ${date}` : date}
                        </div>
                        <div>Price: {price}</div>
                      </div>
                    );
                  }}
                />
                {/** Your historical price line **/}
                <Line dataKey="price" dot={false} stroke="#8884d8" />

                {/** Election reference lines (optional) **/}
                {electionLines.map((e, i) => (
                  <ReferenceLine
                    key={i}
                    x={e.tms}
                    label={<Label position="top" value={e.label} />}
                    stroke="#FF0000"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No price history available.</p>
        )}
      </section>

      {/* Sold volume */}
      <section>
        <h2 className="text-xl mb-2">Sold Volume (latest)</h2>
        {soldData ? (
          <p>
            <strong>{soldData.sellMovingWeek.toLocaleString()}</strong> units sold.{" "}
            <small>(as of {new Date(soldData.timestamp).toLocaleTimeString()})</small>
          </p>
        ) : (
          <p>No sold-volume data available.</p>
        )}
      </section>
    </main>
    </>
  );
}
