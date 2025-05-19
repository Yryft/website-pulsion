// pages/index.js
import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { getAllItems } from "../lib/items";
import { renderNameWithColors } from "../lib/renderName";
import MiniChart from "../components/MiniChart";

export async function getStaticProps() {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  // 1) full catalog for names & autocomplete
  const items = await getAllItems(); // [{ id, name }, …]

  // 2) top‐10 from API
  let topItems = [];
  try {
    const res = await fetch(`${base}/top`);
    if (res.ok) topItems = await res.json();
  } catch (e) {
    console.error("Error fetching /top", e);
  }

  return {
    props: { items, topItems },
    revalidate: 300,
  };
}

export default function Home({ items = [], topItems = [] }) {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const suggBox = useRef(null);

  // build autocomplete suggestions
  useEffect(() => {
    if (!q) {
      setSuggestions([]);
      return;
    }
    const term = q.toLowerCase();
    setSuggestions(
      items.filter(({ name }) => name.toLowerCase().includes(term)).slice(0, 10)
    );
  }, [q, items]);

  // filter top‐10 by query
  const filteredTop = topItems.filter(item => {
    const nameObj = items.find(i => i.id === item.item_id);
    const pretty = nameObj ? nameObj.name : item.item_id;
    return (
      item.item_id.toLowerCase().includes(q.toLowerCase()) ||
      pretty.toLowerCase().includes(q.toLowerCase())
    );
  });

  return (
    <>
      <Head>
        <title>Bazaar Tracker</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="p-8">
        <h1 className="text-3xl mb-6">Bazaar Tracker</h1>

        {/* Autocomplete */}
        <div className="relative mb-6">
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search items…"
            className="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
          />
          {suggestions.length > 0 && (
            <ul
              ref={suggBox}
              className="absolute z-10 w-full bg-white dark:bg-gray-800 border rounded shadow mt-1 max-h-48 overflow-auto"
            >
              {suggestions.map(({ id, name }) => (
                <li
                  key={id}
                  onClick={() => {
                    setQ("");
                    window.location.href = `/items/${id}`;
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  {renderNameWithColors(name, id)}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top 10 Profitable */}
        <section className="mb-8">
          <h2 className="text-2xl mb-2">Top 10 by ROI This Week</h2>
          {filteredTop.length > 0 ? (
            <ul className="space-y-4">
              {filteredTop.map(
                ({
                  item_id,
                  sell_price,
                  buy_price,
                  weekly_volume,
                  spread,
                  max_units,
                  profit_estimate,
                  roi
                }) => {
                  const nameObj = items.find(i => i.id === item_id);
                  const pretty = nameObj ? nameObj.name : item_id;
                  return (
                    <li key={item_id} className="border p-4 rounded">
                      <Link href={`/items/${item_id}`}>
                        <a className="font-semibold hover:underline">
                          {renderNameWithColors(pretty, item_id)}
                        </a>
                      </Link>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Sell @ {sell_price.toLocaleString()}, Buy @ {buy_price.toLocaleString()}
                      </div>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Weekly Vol: {weekly_volume.toLocaleString()}, Top-Of-Book Depth: {max_units}
                      </div>
                      <div className="mt-2 font-bold">
                        Profit: {profit_estimate.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
                        (<span className="text-green-600 dark:text-green-400">{(roi*100).toFixed(1)}%</span>)
                      </div>
                      <div className="mt-4">
                        <MiniChart itemId={item_id} />
                      </div>
                    </li>
                  );
                }
              )}
            </ul>
          ) : (
            <p>No matching top items.</p>
          )}
        </section>
      </main>
    </>
  );
}
