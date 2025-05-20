// pages/index.js
import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { getAllItems } from "../lib/items";
import { renderNameWithColors } from "../lib/renderName";
import MiniChart from "../components/MiniChart";

export async function getStaticProps() {
  const base = process.env.NEXT_PUBLIC_API_BASE || "https://pulsion-apiv1.up.railway.app";
  const items = await getAllItems(); // [{ id, name }, …]

  let topItems = [];
  try {
    const res = await fetch(`${base}/top?limit=100`);
    if (res.ok) topItems = await res.json();
  } catch (e) {
    console.error("Error fetching /top", e);
  }

  return {
    props: { items, topItems },
    revalidate: 5,
  };
}

export default function Home({ items = [], topItems = [] }) {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const suggBox = useRef(null);

  // Show more/less state
  const [showAll, setShowAll] = useState(false);
  const baseCount = 20;
  const displayedItems = showAll ? topItems : topItems.slice(0, baseCount);

  useEffect(() => {
    if (!q) {
      setSuggestions([]);
      return;
    }
    const term = q.toLowerCase();
    setSuggestions(
      items
        .filter(({ name }) => name.toLowerCase().includes(term))
        .slice(0, 10)
    );
  }, [q, items]);

  return (
    <>
      <Head>
        <title>Bazaar Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="px-4 py-6 max-w-screen-xxl mx-auto">
        <h1 className="text-3xl mb-6 font-bold text-center text-black dark:text-white">
          Bazaar Tracker
        </h1>

        {/* Autocomplete */}
        <div className="relative mb-6">
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search items…"
            className="w-full p-2 border rounded text-black bg-blue-200 dark:bg-gray-800 dark:text-white"
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

        {/* Top Profitable Items */}
        <section className="mb-8">
          <h2 className="text-2xl mb-2 text-black dark:text-white">
            Top Return on Investment Items
          </h2>

          {topItems.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {displayedItems.map(
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
                      <div
                        key={item_id}
                        className="border p-4 rounded border-blue-500 dark:border-slate-600 bg-blue-200 dark:bg-gray-800"
                      >
                        <Link
                          href={`/items/${item_id}`}
                          className="block text-center font-semibold underline decoration-transparent hover:decoration-black dark:hover:decoration-white"
                        >
                          {renderNameWithColors(pretty, item_id)}
                        </Link>

                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <p>
                            Sell price: <i><b>{Math.round(sell_price).toLocaleString()}</b></i>
                          </p>
                          <p>
                            Buy price: <i><b>{Math.round(buy_price).toLocaleString()}</b></i>
                          </p>
                        </div>
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          Weekly Vol: <i><b>{weekly_volume.toLocaleString()}</b></i>
                        </div>
                        <div className="mt-2 font-bold text-black dark:text-white">
                          R.O.I:
                          (<span className="text-green-600 dark:text-green-400">
                            {(roi * 100).toFixed(1)}%
                          </span>)
                        </div>
                        <div className="mt-4">
                          <MiniChart itemId={item_id} />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {topItems.length > baseCount && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowAll(prev => !prev)}
                    className="px-4 py-2 border rounded bg-blue-200 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border-blue-500 dark:border-gray-500 transition"
                  >
                    {showAll ? "Show less" : "Show more"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p>No matching top items.</p>
          )}
        </section>
      </main>
    </>
  );
}
