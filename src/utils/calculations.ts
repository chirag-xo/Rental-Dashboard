import {
    type SelectionState,
    type CustomItem,
    type ItemOverride,
} from "@/hooks/usePersistence";
import {
    type CalculatedItem,
    getPackageItems,
    type MeterOption,
} from "@/data/packages";
import type { InventoryCategory } from "@/store/inventoryStore";

export type CalculationResult = {
    items: CalculatedItem[];
    categoryTotals: Record<string, number>;
    grandTotalKnown: number;
    missingWeightCount: number;
};

export function calculateRequirements(
    selection: SelectionState,
    customItems: CustomItem[],
    inventoryCategories: InventoryCategory[],
    overrides: Record<string, ItemOverride> = {}
): CalculationResult {
    let allItems: CalculatedItem[] = [];

    // 1. Process standard packages (based on dynamic inventory)
    Object.entries(selection).forEach(([catName, { meter, qty }]) => {
        if (qty > 0) {
            // Find the category in the inventory
            const category = inventoryCategories.find(c => c.name === catName);

            // If category exists, calculate items. 
            // If it doesn't exist (maybe deleted?), we skip it or handle error.
            if (category) {
                const items = getPackageItems(
                    category.items,
                    catName,
                    meter as MeterOption,
                    qty
                );
                // Apply overrides
                const itemsWithOverrides = items.map(item => {
                    if (overrides[item.name]) {
                        const newQty = overrides[item.name].qty || 0;
                        const newTotalWeight = item.weightPerPc !== null
                            ? parseFloat((newQty * item.weightPerPc).toFixed(2))
                            : null;
                        return { ...item, qty: newQty, totalWeight: newTotalWeight };
                    }
                    return item;
                });
                allItems.push(...itemsWithOverrides);
            }
        }
    });

    // 2. Process custom items
    customItems.forEach((c) => {
        const totalWeight = parseFloat((c.weightPerPc * c.qty).toFixed(2));
        allItems.push({
            name: c.name,
            category: "Others", // Custom added items default to Others or can be a separate group
            qty: c.qty,
            weightPerPc: c.weightPerPc,
            totalWeight: totalWeight,
            isCustom: true,
        });
    });

    // 3. Calculate Totals
    const categoryTotals: Record<string, number> = {};
    let grandTotalKnown = 0;
    let missingWeightCount = 0;

    allItems.forEach((item) => {
        if (item.totalWeight !== null) {
            grandTotalKnown = parseFloat((grandTotalKnown + item.totalWeight).toFixed(2));
            const currentCatTotal = categoryTotals[item.category] || 0;
            categoryTotals[item.category] = parseFloat((currentCatTotal + item.totalWeight).toFixed(2));
        } else {
            missingWeightCount++; // Only if custom items lack weight (unlikely as we require it)
        }

        if (item.weightPerPc === null) {
            // Track missing base weights if any
        }
    });

    // Re-scanning items for missing weights to be precise with the counter
    missingWeightCount = allItems.filter(i => i.weightPerPc === null || i.totalWeight === null).length;

    return {
        items: allItems,
        categoryTotals,
        grandTotalKnown,
        missingWeightCount,
    };
}
