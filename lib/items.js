import items from "../data/items.json";

export function getAllItems() {
  return Object.entries(items).map(([id, { name }]) => ({ id, name }));
}
