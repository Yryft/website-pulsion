import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { getAllItems } from '../../lib/items'
import { renderNameWithColors } from '../../lib/renderName'
import { NumericFormat } from 'react-number-format'
import { PriceChart } from '../../components/PriceChart'

const base = process.env.NEXT_PUBLIC_API_BASE || 'https://pulsion-apiv1.up.railway.app'

export async function getServerSideProps({ params }) {
  const items = await getAllItems()
  const item = items.find((i) => i.id === params.id)
  if (!item) return { notFound: true }

  const soldRes = await fetch(`${base}/sold/${params.id}`)
  const soldData = soldRes.ok ? await soldRes.json() : null

  return {
    props: {
      id: item.id,
      prettyName: item.name,
      soldData,
    },
  }
}

const ranges = [
  { label: 'Last 2 Hours', value: 'latest' },
  { label: '1 Day',        value: '1day'   },
  { label: '1 Week',       value: '1week'  },
  { label: '2 Months',     value: '2months'},
  { label: '6 Months',     value: '6months'},
  { label: 'All Time',     value: 'all'     },
]

function formatDate(ts) {
  const d = new Date(ts)
  const day   = String(d.getDate()).padStart(2, '0')
  const month = d.toLocaleString('en-US', { month: 'short' })
  const year  = d.getFullYear()
  const hh    = String(d.getHours()).padStart(2, '0')
  const mm    = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${month} ${year}, ${hh}:${mm}`
}

export default function ItemPage({ id, prettyName, soldData }) {
  const router = useRouter()
  const [query, setQuery]     = useState('')
  const [allItems, setAllItems] = useState([])
  const [open, setOpen]       = useState(false)
  const inputRef              = useRef()

  const [priceData, setPriceData] = useState([])
  const [range, setRange]         = useState('1week')
  const [latestData, setLatestData] = useState(soldData)

  const [budgetInput, setBudgetInput] = useState('100,000,000')
  const [budget, setBudget]           = useState(100000000)

  const [mayors, setMayors] = useState([])

  // Autocomplete items
  useEffect(() => {
    getAllItems().then(setAllItems)
  }, [])

  // Fetch prices & sold data
  useEffect(() => {
    if (!id) return

    fetch(`${base}/prices/${id}?range=${range}`)
      .then((r) => r.json())
      .then((data) => {
        setPriceData(
          data.map((e) => ({
            displayTime: formatDate(e.timestamp),
            data: {
              buyPrice:  Math.round(e.data.buyPrice),
              sellPrice: Math.round(e.data.sellPrice),
            },
          }))
        )
      })

    fetch(`${base}/sold/${id}`)
      .then((r) => r.json())
      .then(setLatestData)
  }, [id, range])

  // Fetch mayor annotations
  useEffect(() => {
    fetch(`${base}/elections`)
      .then((r) => r.json())
      .then((data) =>
        setMayors(
          data
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .map((e) => ({ ...e, displayTime: formatDate(e.timestamp) }))
        )
      )
  }, [])

  // Close autocomplete on click outside
  useEffect(() => {
    function handle(e) {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handle)
    return () => document.removeEventListener('click', handle)
  }, [])

  // Autocomplete suggestions
  const suggestions = query
    ? allItems
        .filter((i) =>
          i.name.toLowerCase().includes(query.trim().toLowerCase())
        )
        .slice(0, 10)
    : []

  // Calculate flip metrics
  const { maxQty, potentialProfit } = (() => {
    if (
      !latestData?.sellMovingWeek ||
      !latestData.buyPrice ||
      !latestData.sellPrice
    ) {
      return { maxQty: 0, potentialProfit: 0 }
    }
    const marketCap  = Math.round(latestData.sellMovingWeek * 0.1)
    const capitalCap = Math.floor(budget / latestData.sellPrice)
    const qty = Math.min(marketCap, capitalCap)
    const profit = Math.round((latestData.buyPrice - latestData.sellPrice) * qty)
    return { maxQty: qty, potentialProfit: profit }
  })()

  return (
    <>
      <Head>
        <title>
          {prettyName.replace(/§[0-9a-fA-F]/g, '')} | Bazaar Tracker
        </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="p-6 max-w-screen-xxl mx-auto space-y-8">
        {/* Back + Search */}
        <div className="flex items-center space-x-2">
          <Link
            href="/"
            className="px-3 py-1 rounded border border-blue-400 dark:border-gray-600 bg-blue-200 text-black dark:bg-gray-800 dark:text-white"
          >
            ← Back to Home
          </Link>
          <div className="relative flex-1" ref={inputRef}>
            <input
              type="text"
              value={query}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value)
                setOpen(true)
              }}
              placeholder="Search items…"
              className="w-full p-2 border rounded bg-blue-200 text-black dark:bg-gray-800 dark:text-white"
            />
            {open && suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border rounded shadow max-h-60 overflow-auto">
                {suggestions.map(({ id: iid, name }) => (
                  <li
                    key={iid}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => {
                      setOpen(false)
                      router.push(`/items/${iid}`)
                    }}
                  >
                    {renderNameWithColors(name, iid)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mt-8">
          {renderNameWithColors(prettyName, id)}
        </h1>

        {/* Chart header + Range */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
          <h2 className="text-xl text-black dark:text-white">
            Buy &amp; Sell Price History
          </h2>
          <div className="relative">
            <select
              id="range"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="border p-2 rounded pr-8 bg-blue-200 text-black dark:bg-gray-800 dark:text-white"
            >
              {ranges.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <svg
                className="w-4 h-4 text-black dark:text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <div className="overflow-x-auto">
          <div className="min-w-[600px] h-[300px]">
            <PriceChart data={priceData} annotations={mayors} />
          </div>
        </div>

        {/* Volume & Profit Grid */}
        {latestData && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 border rounded text-black dark:text-white bg-blue-200 dark:bg-gray-800 border-blue-300 dark:border-gray-700">
              <h2 className="text-xl">Sold Volume</h2>
              <p>
                <strong>
                  {latestData.sellMovingWeek.toLocaleString()}
                </strong>{' '}
                units sold (last 7d).
              </p>
            </div>

            {/* 2) Budget Input */}
            <div className="space-y-2 p-4 border rounded border-blue-300 bg-blue-200 dark:bg-gray-800 dark:border-gray-700">
              <label htmlFor="budget" className="block font-semibold text-black dark:text-white">
                Your Budget (coins)
              </label>
              <NumericFormat
                id="budget"
                value={budget}
                thousandSeparator=" "
                allowLeadingZeros={false}
                allowNegative={false}
                suffix=""
                onKeyDown={(e) => {
                  const key = e.key.toLowerCase()
                  const multiplier = key === 'k' ? 1e3 : key === 'm' ? 1e6 : key === 'b' ? 1e9 : null
                  if (multiplier) {
                    e.preventDefault()
                    const newBudget = Math.round((budget || 0) * multiplier)
                    setBudget(newBudget)
                  }
                }}
                onValueChange={({ value: numericValue }) => {
                  setBudget(numericValue || 0)
                }}
                className="w-full p-2 border rounded text-black dark:bg-gray-800 dark:text-white"
                placeholder="Enter budget…"
              />

            </div>

            <div className="p-4 border rounded text-black dark:text-white bg-blue-200 dark:bg-gray-800 border-blue-300 dark:border-gray-700 space-y-2">
              <h2 className="text-xl text-black dark:text-white">
                Flip Analysis
              </h2>
              <p>
                Max items to flip: <strong>{maxQty}</strong>
              </p>
              <p>
                Potential profit:{' '}
                <strong>{potentialProfit.toLocaleString()} coins</strong>
              </p>
            </div>
          </section>
        )}
      </main>
    </>
  )
}
