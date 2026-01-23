import {
    type SelectionState,
    type CustomItem,
} from "@/hooks/usePersistence";
import {
    type PackageCategory,
    type CalculatedItem,
    getPackageItems,
    type MeterOption,
} from "@/data/packages";

export type CalculationResult = {
    items: CalculatedItem[];
    categoryTotals: Record<string, number>;
    grandTotalKnown: number;
    missingWeightCount: number;
};

export function calculateRequirements(
    selection: SelectionState,
    customItems: CustomItem[]
): CalculationResult {
    let allItems: CalculatedItem[] = [];

    // 1. Process standard packages
    Object.entries(selection).forEach(([cat, { meter, qty }]) => {
        if (qty > 0) {
            const items = getPackageItems(
                cat as PackageCategory,
                meter as MeterOption,
                qty
            );
            allItems.push(...items);
        }
    });

    // 2. Process custom items
    customItems.forEach((c) => {
        const totalWeight = parseFloat((c.weightPerPc * c.qty).toFixed(2));
        allItems.push({
            name: c.name,
            category: "Others", // Default custom to Others or separate? Let's use Others for now or "Custom"
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
            missingWeightCount++;
        }
    });

    return {
        items: allItems,
        categoryTotals,
        grandTotalKnown,
        missingWeightCount,
    };
}
