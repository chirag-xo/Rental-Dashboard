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
    Object.entries(selection).forEach(([catName, { meter, qty }]) => {
        if (qty > 0) {
            const category = inventoryCategories.find(c => c.name === catName);

            if (category) {
                const items = getPackageItems(
                    category.items,
                    catName,
                    meter as MeterOption,
                    qty
                );
                // Apply overrides later or now? 
                // Plan: Standard items -> Direct Items -> Custom Items -> MERGE -> Apply Overrides to Merged?
                // actually overrides key is name. If we merge first, then override.
                // But the current logic applies overrides to package items immediately.
                // Let's keep it consistent: gather all raw items first.
                // Wait, previous logic applied overrides here. 
                // If we merge, we might lose individual override targeting if names overlap?
                // But "Rajaigad" is "Rajaigad". Override for "Rajaigad" should apply to the total?
                // Or does override apply only to package items? 
                // "Editable quantities" in Step 2 usually maps to `overrides`.
                // So yes, we should produce raw items, MERGE them, then applying overrides might be tricky
                // because overrides are "absolute values" usually?
                // No, existing override logic:
                // const newQty = overrides[item.name].qty || 0;
                // It REPLACES the qty.
                // If we have 2 sources of "Clamp", say 10 from Cat A, 5 from Direct. Total 15.
                // If user edits to 20 in Step 2. Then override says "Clamp" = 20.
                // This implies overrides should be applied AFTER merging.
                // But wait, the existing code applies overrides inside the loop.
                // If I change that, I must ensure `mergeItems` doesn't double count or something.

                // Let's collect RAW items first without overrides from packages.
                // BUT `getPackageItems` returns standard counts.
                // Previous code:
                /*
                 const itemsWithOverrides = items.map(item => {
                    if (overrides[item.name]) { ... return { ...item, qty: override } } 
                 });
                */
                // If I have "Clamp" from Cat A (10) and Cat B (10). Total 20.
                // If I override "Clamp" to 25.
                // If I applied checks individually: Cat A Clamp -> 25? Cat B Clamp -> 25? Total 50? wrong.
                // Overrides are usually per "Row" in Step 2.
                // Since Step 2 rows are unique by name (Merged), the override applies to the Name.
                // So: Collect ALL raw items -> MERGE -> APPLY OVERRIDES.

                rawItems.push(...items);
            }
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
        });
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
        });
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
