import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { getAllItems } from '../../lib/items';
import { renderNameWithColors } from '../../lib/renderName';
import { useHumanNumber } from '../../hooks/useHumanNumber';
import { PriceChart } from '../../components/PriceChart';

const base = process.env.NEXT_PUBLIC_API_BASE || 'https://pulsion-apiv1.up.railway.app';

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
  { label: 'Last 2 Hours', value: 'latest' },
  { label: '1 Day', value: '1day' },
  { label: '1 Week', value: '1week' },
  { label: '2 Months', value: '2months' },
  { label: '6 Months', value: '6months' },
  { label: 'All Time', value: 'all' },
];

function formatDate(ts) {
  const d = new Date(ts);
  return (
    d.getDate().toString().padStart(2, '0') + ' ' +
    d.toLocaleString('en-US', { month: 'short' }) + ' ' +
    d.getFullYear() + ', ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0')
  );
}

export default function ItemPage({ id, prettyName, soldData }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [allItems, setAllItems] = useState([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef();

  const [priceData, setPriceData] = useState([]);
  const [range, setRange] = useState('1week');
  const { raw: budgetInput, value: budget, onChange: onBudgetChange } = useHumanNumber(100000000);
  const [latestData, setLatestData] = useState(soldData);
  const [mayors, setMayors] = useState([]);

  // fetch items for autocomplete
  useEffect(() => {
    getAllItems().then(setAllItems);
  }, []);

  // fetch price & sold data on id or range change
  useEffect(() => {
    if (!id) return;
    fetch(`${base}/prices/${id}?range=${range}`)
      .then((r) => r.json())
      .then((data) => {
        const rounded = data.map((e) => ({
          displayTime: formatDate(e.timestamp),
          data: {
            buyPrice: Math.round(e.data.buyPrice),
            sellPrice: Math.round(e.data.sellPrice),
          },
        }));
        setPriceData(rounded);
      });

    fetch(`${base}/sold/${id}`)
      .then((r) => r.json())
      .then(setLatestData);
  }, [id, range]);

  // fetch mayor annotations once
  useEffect(() => {
    fetch(`${base}/elections`)
      .then((r) => r.json())
      .then((data) =>
        setMayors(data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .map((e) => ({ ...e, displayTime: formatDate(e.timestamp) }))
        )
      );
  }, []);

  // close autocomplete when clicking outside
  useEffect(() => {
    function handle(e) {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, []);

  const suggestions = query
    ? allItems
        .filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase()))
        .slice(0, 10)
    : [];

  // profit calculation
  const calc = () => {
    if (!latestData?.sellMovingWeek || !latestData.buyPrice || !latestData.sellPrice)
      return { maxQty: 0, potentialProfit: 0 };
    const marketCap = Math.round(latestData.sellMovingWeek * 0.1);
    const capitalCap = Math.floor(budget / latestData.sellPrice);
    const maxQty = Math.min(marketCap, capitalCap);
    const profit = Math.round((latestData.buyPrice - latestData.sellPrice) * maxQty);
    return { maxQty, potentialProfit: profit };
  };
  const { maxQty, potentialProfit } = calc();

  return (
    <>
      <Head>
        <title>{prettyName.replace(/§[0-9a-fA-F]/g, '')} | Bazaar Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Autocomplete */}
        <div className="relative" ref={inputRef}>
          <input
            type="text"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            placeholder="Search items…"
            className="w-full p-2 border rounded bg-white text-black dark:bg-gray-800 dark:text-white"
          />
          {open && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border rounded shadow max-h-60 overflow-auto">
              {suggestions.map(({ id: iid, name }) => (
                <li
                  key={iid}
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    setOpen(false);
                    router.push(`/items/${iid}`);
                  }}
                >
                  {renderNameWithColors(name, iid)}
                </li>
              ))}
            </ul>
          )}
        </div>
        

        <Link href="/" className="inline-block px-3 py-1 rounded bg-blue-300 text-white dark:bg-gray-700">
          ← Back to Home
        </Link>
        <h1
        className="
          text-2xl
          font-bold
          text-center     /* center it horizontally */
          mt-8            /* add some space above */
        "
        >
          {renderNameWithColors(prettyName, id)}
        </h1>
        {/* Range Select */}
        <div className="flex flex-wrap gap-4 items-center">
          <label htmlFor="range" className="font-semibold text-black dark:text-white">Select range</label>
          <div className="relative">
            <select
              id="range"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="appearance-none border p-2 rounded pr-8 dark:bg-gray-800 dark:text-white"
            >
              {ranges.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <section>
          <h2 className="text-xl mb-2 text-black dark:text-white">Buy & Sell Price History</h2>
          <div className="overflow-x-auto">
            <div className="min-w-[600px] h-[300px]">
              <PriceChart data={priceData} annotations={mayors} />
            </div>
          </div>

        </section>

        {/* Volume & Profit */}
        {latestData && (
          <section className="space-y-2">
            <h2 className="text-xl text-black dark:text-white">Sold Volume</h2>
            <p className="text-black dark:text-white">
              <strong>{latestData.sellMovingWeek.toLocaleString()}</strong> units sold (last 7d).
            </p>

            <label htmlFor="budget" className="block font-semibold mt-4 text-black dark:text-white">Your Budget (coins)</label>
            <input
              id="budget"
              type="text"
              value={budgetInput}
              onChange={onBudgetChange}
              className="p-2 border rounded w-full max-w-sm"
            />

            <p className="text-black dark:text-white">
              Max items to flip: <strong>{maxQty}</strong><br />
              Potential profit: <strong>{potentialProfit.toLocaleString()} coins</strong>
            </p>
          </section>
        )}
      </main>
    </>
  );
}
