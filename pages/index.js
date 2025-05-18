// pages/index.js
import Link from "next/link";
import { getAllItems } from "../lib/items";
import { renderNameWithColors } from "../lib/renderName";
import { useState } from "react";

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
        {filtered.map(({ id, name }) => (
          <li key={id}>
            <Link href={`/items/${id}`}>
              <div className="block p-4 border rounded hover:shadow-sm">
                {renderNameWithColors(name, id)}
              </div>
            </Link>
          </li>
        ))}
        {filtered.length === 0 && <p>No items match “{q}.”</p>}
      </ul>
    </main>
  );
}
