import type { InventoryItem } from "@/store/inventoryStore";

export type MeterOption = 20 | 30 | 40 | 50;
// PackageCategory is now just string, but we can keep alias if helpful, 
// though dynamic categories means any string is valid.
export type PackageCategory = string;

export type CalculatedItem = {
    name: string;
    category: string;
    qty: number;
    weightPerPc: number | null;
    totalWeight: number | null;
    isCustom?: boolean;
};

// Scaling factors relative to 30m
export const SCALING_FACTORS: Record<MeterOption, number> = {
    20: 0.67,
    30: 1.0,
    40: 1.33,
    50: 1.67,
    50: 1.67, // Duplicate 50 logic? 50 is listed once.
};

/**
 * Calculates the list of items for a given category selection, 
 * based on the provided dynamic inventory items.
 */
export function getPackageItems(
    items: InventoryItem[],
    categoryName: string,
    meter: MeterOption,
    qty: number
): CalculatedItem[] {
    if (qty <= 0) return [];

    return items.map((item) => {
        // Use override if exists for this meter, otherwise fall back to scaling defaultQty
        let totalQty = 0;
        if (item.qtyOverrides && item.qtyOverrides[meter] !== undefined) {
            totalQty = item.qtyOverrides[meter] * qty;
        } else {
            const scale = SCALING_FACTORS[meter] || 1.0;
            totalQty = Math.round(item.defaultQty * scale * qty);
        }

        // Ensure strictly 2 decimal places for weight
        const totalWeight = item.weightPerPcKg !== null
            ? parseFloat((totalQty * item.weightPerPcKg).toFixed(2))
            : null;

        return {
            name: item.name,
            category: categoryName,
            qty: totalQty,
            weightPerPc: item.weightPerPcKg,
            totalWeight,
            isCustom: false,
        };
    });
}
