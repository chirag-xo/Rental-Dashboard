import { normalizeItemName } from "./normalization";
import type { CalculatedItem } from "@/data/packages";

/**
 * Merges a list of items based on normalized name.
 * - Sums quantities.
 * - Preserves category (first encountered).
 * - Preserves non-null weight (prefers existing).
 */
export function mergeItems(items: CalculatedItem[]): CalculatedItem[] {
    const map = new Map<string, CalculatedItem>();

    for (const item of items) {
        const key = normalizeItemName(item.name);

        if (map.has(key)) {
            const existing = map.get(key)!;

            // Merge Qty
            existing.qty += item.qty;

            // Update Weight info if existing was missing it
            if (existing.weightPerPc === null && item.weightPerPc !== null) {
                existing.weightPerPc = item.weightPerPc;
            }

            // Recalculate total weight based on new qty and (potentially new) weightPerPc
            if (existing.weightPerPc !== null) {
                existing.totalWeight = parseFloat((existing.qty * existing.weightPerPc).toFixed(2));
            } else {
                existing.totalWeight = null;
            }

            // If item has a specific category and existing is "Others" or "Mixed", maybe update?
            // For now, keep existing category to avoid jumping around. 
        } else {
            // Clone item to avoid mutation references if needed
            map.set(key, { ...item });
        }
    }

    return Array.from(map.values());
}
