export type Item = { name: string; price: number };

export const initialItems: Item[] = [
  { name: "우유", price: 2000 },
  { name: "빵", price: 3000 },
];

export const addedItem: Item = { name: "사과", price: 1000 };

export function getItemSum(items: Item[]): number {
  let sum = 0;
  for (const item of items) {
    sum += item.price;
  }
  return sum;
}
