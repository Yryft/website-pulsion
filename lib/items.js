import items from "../data/items.json";

export async function getAllItems() {
  // Fetch the list of item IDs from your API
//   const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/items`);
  const res = await fetch(`https://pulsion-apiv1.up.railway.app/items`);
  const apiIds = await res.json();

  // Filter the items.json entries
  return Object.entries(items)
    .filter(([id]) => apiIds.includes(id))
    .map(([id, { name }]) => ({ id, name }));
}

