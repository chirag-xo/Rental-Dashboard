import {
    type SelectionState,
    type CustomItem,
    type ItemOverride,
} from "@/hooks/usePersistence";
import {
    type CalculatedItem,
    getPackageItems,
} from "@/data/packages";
import type { InventoryCategory, MeterOption } from "@/store/inventoryStore";

export type CalculationResult = {
    items: CalculatedItem[];
    categoryTotals: Record<string, number>;
    grandTotalKnown: number;
    missingWeightCount: number;
};

import { mergeItems } from "./mergeItems";

export function calculateRequirements(
    selection: SelectionState,
    customItems: CustomItem[],
    inventoryCategories: InventoryCategory[],
    overrides: Record<string, ItemOverride> = {},
    directItems: CustomItem[] = []
): CalculationResult {
    let rawItems: CalculatedItem[] = [];

    // 1. Process standard packages (based on dynamic inventory)
    // 1. Process standard packages (based on dynamic inventory)
    Object.entries(selection).forEach(([catName, items]) => {
        // items is SelectionItem[]
        if (Array.isArray(items)) {
            items.forEach(({ meter, qty }) => {
                if (qty > 0) {
                    const category = inventoryCategories.find(c => c.name === catName);

                    if (category) {
                        const packageItems = getPackageItems(
                            category.items,
                            catName,
                            meter as MeterOption,
                            qty
                        );
                        rawItems.push(...packageItems);
                    }
                }
            });
        }
    });

    // 2. Process Direct Items
    directItems.forEach(d => {
        const totalWeight = parseFloat((d.weightPerPc * d.qty).toFixed(2));
        rawItems.push({
            name: d.name,
            category: "Direct Selection", // Distinct category or mixed?
            qty: d.qty,
            weightPerPc: d.weightPerPc,
            totalWeight: totalWeight,
            isCustom: false, // It's "Direct", not "Custom" in the sense of Step 2 add? Or is it?
            // Step 2 custom added items are `customItems`.
            ...(d.length && { length: d.length }), // Include length if present
        } as CalculatedItem);
    });

    // 3. Process Custom Items (Step 2 added)
    customItems.forEach((c) => {
        const totalWeight = parseFloat((c.weightPerPc * c.qty).toFixed(2));
        rawItems.push({
            name: c.name,
            category: "Custom Added",
            qty: c.qty,
            weightPerPc: c.weightPerPc,
            totalWeight: totalWeight,
            isCustom: true,
            ...(c.length && { length: c.length }), // Include length if present
        } as CalculatedItem);
    });

    // 4. MERGE
    let mergedItems = mergeItems(rawItems);

    // 5. Apply Overrides (Step 2 edits)
    // Overrides map: name -> { qty, weightPerPc }
    // Since mergedItems are unique by normalized name, this works perfectly.
    // We need to match normalized names for overrides too? 
    // Usually overrides keys are exactly what was displayed in the table.
    // Ensure `ReviewItems.tsx` uses the same name from the list.

    const finalItems = mergedItems.map(item => {
        // We might want to try exact match first, then normalized?
        // Simpler: use exact match as the key in overrides is likely the display name from the table.
        // But `mergeItems` might change the "name" to whichever casing it found first.
        // `mergeItems` preserves the name of the first item encountered.
        // `ReviewItems` renders that name. `handleUpdateQty` uses that name.
        // So exact match on `item.name` should work!

        if (overrides[item.name]) {
            const override = overrides[item.name];
            // If qty is defined in override, use it.
            // Note: override.qty being 0 is valid.
            const hasQtyOverride = override.qty !== undefined;
            const newQty = hasQtyOverride ? override.qty! : item.qty;

            // Weight override?
            const hasWeightOverride = override.weightPerPc !== undefined;
            const newWeightPerPc = hasWeightOverride ? override.weightPerPc! : item.weightPerPc;

            // Recalc total weight
            const newTotalWeight = newWeightPerPc !== null
                ? parseFloat((newQty * newWeightPerPc).toFixed(2))
                : null;

            return {
                ...item,
                qty: newQty,
                weightPerPc: newWeightPerPc,
                totalWeight: newTotalWeight
            };
        }
        return item;
    });

    // 6. Calculate Totals
    const categoryTotals: Record<string, number> = {};
    let grandTotalKnown = 0;

    finalItems.forEach((item) => {
        if (item.totalWeight !== null) {
            grandTotalKnown = parseFloat((grandTotalKnown + item.totalWeight).toFixed(2));
            const currentCatTotal = categoryTotals[item.category] || 0;
            categoryTotals[item.category] = parseFloat((currentCatTotal + item.totalWeight).toFixed(2));
        }
    });

    // Re-scanning items for missing weights
    const missingWeightCount = finalItems.filter(i => i.weightPerPc === null || i.totalWeight === null).length;

    return {
        items: finalItems,
        categoryTotals,
        grandTotalKnown,
        missingWeightCount,
    };
}
