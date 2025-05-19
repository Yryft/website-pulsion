// pages/items/[id].js
import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getAllItems } from "../../lib/items";
import { renderNameWithColors } from "../../lib/renderName";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const base = process.env.NEXT_PUBLIC_API_BASE;

export async function getServerSideProps({ params }) {
  const items = await getAllItems();
  const item = items.find((i) => i.id === params.id);
  if (!item) return { notFound: true };

  const soldRes = await fetch(`${base}/sold/${params.id}`);
  const soldData = soldRes.ok ? await soldRes.json() : null;

  return {
    props: {
      id: item.id,
      prettyName: item.name,
      soldData,
    },
  };
}

const ranges = [
  { label: "Last 2 Hours", value: "latest" },
  { label: "1 Day", value: "1day" },
  { label: "1 Week", value: "1week" },
  { label: "2 Months", value: "2months" },
  { label: "6 Months", value: "6months" },
  { label: "All Time", value: "all" },
];

export default function ItemPage({ id, prettyName, soldData }) {
  const router = useRouter();

  // Autocomplete
  const [query, setQuery] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef();

  const [priceData, setPriceData] = useState([]);
  const [range, setRange] = useState("1week");
  const [budget, setBudget] = useState(1000000);
  const [latestData, setLatestData] = useState(soldData);

  useEffect(() => {
    getAllItems().then(setAllItems);
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`${base}/prices/${id}?range=${range}`)
      .then((res) => res.json())
      .then(setPriceData);
      console.log(priceData)

    fetch(`${base}/sold/${id}`)
      .then((res) => res.json())
      .then(setLatestData);
      console.log(latestData)
  }, [id, range]);

  const suggestions = query
    ? allItems
        .filter(({ name }) =>
          name.toLowerCase().includes(query.trim().toLowerCase())
        )
        .slice(0, 10)
    : [];

  useEffect(() => {
    function onClickOutside(e) {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  const calculatePotentialProfit = () => {
    if (
      !latestData ||
      !latestData.sellMovingWeek ||
      !latestData.buyPrice ||
      !latestData.sellPrice
    ) {
      return { maxQty: 0, potentialProfit: 0 };
    }
    const marketCapQty = Math.floor(latestData.sellMovingWeek * 0.1);
    const capitalCapQty = Math.floor(budget / latestData.buyPrice);
    const maxQty = Math.min(marketCapQty, capitalCapQty);
    const potentialProfit =
      (latestData.sellPrice - latestData.buyPrice) * maxQty;
    return { maxQty, potentialProfit };
  };

  const { maxQty, potentialProfit } = calculatePotentialProfit();

  return (
    <>
      <Head>
        <title>{prettyName.replace(/§[0-9a-fA-F]/g, "")} | Bazaar Tracker</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Autocomplete Search */}
        <div className="relative" ref={inputRef}>
          <input
            type="text"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            placeholder="Search items…"
            className="w-full p-2 border rounded bg-white text-black placeholder-gray-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
          {open && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow max-h-60 overflow-auto">
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

        <Link href="/">
          <a className="inline-block px-3 py-1 rounded bg-gray-200 text-black hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
            ← Back to Home
          </a>
        </Link>

        <h1 className="text-2xl font-bold">
          {renderNameWithColors(prettyName, id)}
        </h1>

        {/* Range Select */}
        <div className="flex gap-4 items-center">
          <label htmlFor="range" className="font-semibold">
            Select range
          </label>
          <select
            id="range"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="border p-2 rounded"
          >
            {ranges.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price Chart */}
        <section className="w-full overflow-x-auto">
          <h2 className="text-xl mb-2">Buy & Sell Price History</h2>
          <div className="min-w-[1000px] h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceData} margin={{ top: 30, right: 60, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSell" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" hide />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="data.buyPrice" name="Buy Price" stroke="#82ca9d" fill="url(#colorBuy)" />
                <Area type="monotone" dataKey="data.sellPrice" name="Sell Price" stroke="#8884d8" fill="url(#colorSell)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Sold Volume and Profit Estimation */}
        {latestData && (
          <section className="space-y-2">
            <h2 className="text-xl">Sold Volume</h2>
            <p>
              <strong>{latestData.sellMovingWeek.toLocaleString()}</strong> units sold (last 7d).
            </p>

            <label htmlFor="budget" className="block font-semibold mt-4">
              Your Budget (coins)
            </label>
            <input
              id="budget"
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="p-2 border rounded w-full max-w-sm"
            />
            <p>
              Max items to flip: <strong>{maxQty}</strong>
              <br />
              Potential profit: <strong>{potentialProfit.toLocaleString()} coins</strong>
            </p>
          </section>
        )}
      </main>
    </>
  );
}
