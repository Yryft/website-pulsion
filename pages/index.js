// pages/index.js
import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { getAllItems } from "../lib/items";
import { renderNameWithColors } from "../lib/renderName";
import MiniChart from "../components/MiniChart";

export async function getStaticProps() {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  // Get full catalog for autocomplete and name lookup
  const items = await getAllItems();  // returns [{id,name},…]
  const ids = items.map(({ id }) => id);

  // Fetch top‐10 from API
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

  // Autocomplete suggestions
  useEffect(() => {
    if (!q) return setSuggestions([]);
    const term = q.toLowerCase();
    setSuggestions(
      items.filter(({ name }) => name.toLowerCase().includes(term)).slice(0, 10)
    );
  }, [q, items]);

  // Filter top list by ID or name
  const filteredTop = topItems.filter(item => {
    const nameObj = items.find(i => i.id === item.item_id);
    const name = nameObj ? nameObj.name : item.item_id;
    return (
      item.item_id.toLowerCase().includes(q.toLowerCase()) ||
      name.toLowerCase().includes(q.toLowerCase())
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

        {/* Autocomplete Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search items…"
            className="w-full p-2 border rounded"
          />
          {suggestions.length > 0 && (
            <ul
              ref={suggBox}
              className="absolute z-10 w-full bg-white border rounded shadow mt-1 max-h-48 overflow-auto"
            >
              {suggestions.map(({ id, name }) => (
                <li
                  key={id}
                  onClick={() => {
                    setQ("");
                    window.location.href = `/items/${id}`;
                  }}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top 10 Profitable */}
        <section className="mb-8">
          <h2 className="text-2xl mb-2">Top 10 Profitable This Week</h2>
          {filteredTop.length > 0 ? (
            <ul className="space-y-4">
              {filteredTop.map(
                ({ item_id, sell_price, buy_price, sell_moving_week, revenue_estimate }) => {
                  const nameObj = items.find(i => i.id === item_id);
                  return (
                    <li key={item_id} className="border p-4 rounded">
                      <Link href={`/items/${item_id}`}>
                        <a className="font-semibold hover:underline">
                          {nameObj ? renderNameWithColors(nameObj.name, item_id) : item_id}
                        </a>
                      </Link>
                      <div>
                        Sell: {sell_price}, Buy: {buy_price}, Vol: {sell_moving_week}
                      </div>
                      <div className="font-bold">
                        Est. Profit: {revenue_estimate.toFixed(0)}
                      </div>
                      <MiniChart itemId={item_id} />
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
