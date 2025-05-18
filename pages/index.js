// pages/index.js
import Head from "next/head";
import Link from "next/link";
import { getAllItems } from "../lib/items";
import { renderNameWithColors } from "../lib/renderName";
import { useState } from "react";

export async function getStaticProps() {
  const items = await getAllItems();

  const base = process.env.API_BASE || "https://pulsion-apiv1.up.railway.app";
  const metrics = await Promise.all(
    items.map(async ({ id, name }) => {
      try {
        const [soldRes, pricesRes] = await Promise.all([
          fetch(`${base}/sold/${id}?range=1week`),
          fetch(`${base}/prices/${id}?range=1week`)
        ]);
        if (!soldRes.ok || !pricesRes.ok) return null;

        const soldData     = await soldRes.json();
        const priceHistory = await pricesRes.json();
        if (!priceHistory.length) return null;

        const latestPrice = priceHistory[priceHistory.length - 1].price.sellPrice;
        const sold        = soldData.sold || 0;
        return { id, name, sold, latestPrice, revenue: sold * latestPrice };
      } catch {
        return null;
      }
    })
  );

  const topItems = metrics
    .filter(Boolean)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    props: { items, topItems },
    revalidate: 60,
  };
}

export default function Home({ items = [], topItems = [] }) {
  const [q, setQ] = useState("");

  const filtered = items.filter(({ name }) =>
    name.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Bazaar Tracker</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="p-8">
        <h1 className="text-3xl mb-6">Bazaar Tracker</h1>

        {topItems.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl mb-2">Top 10 Most Profitable This Week</h2>
            <ul className="space-y-2">
              {topItems.map(({ id, name, revenue, sold, latestPrice }) => (
                <li key={id} className="flex justify-between">
                  <Link
                    href={`/items/${id}`}
                    className="font-medium hover:underline"
                  >
                    {renderNameWithColors(name, id)}
                  </Link>
                  <span className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Sold: {sold.toLocaleString()} @ {latestPrice.toLocaleString()}
                    </div>
                    <div className="font-semibold">
                      ${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search items…"
          className="w-full mb-6 p-2 border rounded"
        />

        <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.length > 0 ? (
            filtered.map(({ id, name }) => (
              <li key={id}>
                <Link
                  href={`/items/${id}`}
                  className="block p-4 border rounded hover:shadow-sm"
                >
                  {renderNameWithColors(name, id)}
                </Link>
              </li>
            ))
          ) : (
            <p>No items match “{q}.”</p>
          )}
        </ul>
      </main>
    </>
  );
}
