// pages/index.js
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { getAllItems } from "../lib/items";
import { renderNameWithColors } from "../lib/renderName";

export async function getStaticProps() {
  const items = await getAllItems();
  return { props: { items } };
}

export default function Home({ items }) {
  const [q, setQ] = useState("");

  // case-insensitive filter on the pretty name
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
        <h1 className="text-3xl mb-4">Bazaar Items</h1>

        {/* Search box */}
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
