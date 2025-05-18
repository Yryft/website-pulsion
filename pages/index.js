import Link from "next/link";
import { getAllItems } from "../lib/items";

export async function getStaticProps() {
  return { props: { items: getAllItems() } };
}

export default function Home({ items }) {
  return (
    <main className="p-8">
      <h1 className="text-3xl mb-6">Bazaar Items</h1>
      <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(({ id, name }) => (
          <li key={id}>
            <Link href={`/items/${id}`}>
              <a className="block p-4 border rounded">{name}</a>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
