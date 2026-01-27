import type { InventoryItem, MeterOption } from "@/store/inventoryStore";

// PackageCategory is now just string
export type PackageCategory = string;

export type CalculatedItem = {
    name: string;
    category: string;
    qty: number;
    weightPerPc: number | null;
    totalWeight: number | null;
    isCustom?: boolean;
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

    // Filter items that match the selected length
    const relevantItems = items.filter(item => item.length === meter);

    return relevantItems.map((item) => {
        // No scaling factors anymore. Use item.quantity directly.
        // If qty > 1 (multiple packages), multiply.

        // Wait, previously `qtyOverrides` was handled here.
        // Now "Overrides" are gone from Schema.
        // We just have `quantity`.

        const totalQty = item.quantity * qty;

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
