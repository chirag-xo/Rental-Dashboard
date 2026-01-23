export type MeterOption = 20 | 30 | 40 | 50;
export type PackageCategory = "Ring" | "Bay" | "Fabric" | "Others" | "Fasad";

export type PackageItem = {
    name: string;
    weightPerPcKg: number | null;
    baseQty: number; // qty per 30m package
};

export type CalculatedItem = {
    name: string;
    category: PackageCategory;
    qty: number;
    weightPerPc: number | null;
    totalWeight: number | null;
    isCustom?: boolean;
};

// Scaling factors relative to 30m
const SCALING_FACTORS: Record<MeterOption, number> = {
    20: 0.67,
    30: 1.0,
    40: 1.33,
    50: 1.67,
};

// Base 30m Package Data
const BASE_PACKAGES: Record<PackageCategory, PackageItem[]> = {
    Ring: [
        { name: "Rafter 2 Patti", weightPerPcKg: 55.310, baseQty: 4 },
        { name: "Rafter 3 Patti", weightPerPcKg: 56.920, baseQty: 2 },
        { name: "Piller with Gulla", weightPerPcKg: 53.990, baseQty: 2 },
        { name: "Kanplate", weightPerPcKg: 14.990, baseQty: 4 },
        { name: "Base plate", weightPerPcKg: 17.340, baseQty: 2 },
        { name: "Alluminium Jointer", weightPerPcKg: 13.280, baseQty: 4 },
        { name: "V Jointer", weightPerPcKg: 32.630, baseQty: 1 },
        { name: "Side brasing", weightPerPcKg: 24.290, baseQty: 2 },
        { name: "Centre brasing", weightPerPcKg: 18.260, baseQty: 1 },
        { name: "Khunte", weightPerPcKg: 3.260, baseQty: 8 },
        { name: "Rachit belt", weightPerPcKg: 1.470, baseQty: 2 },
        { name: "Nut bolt", weightPerPcKg: 0.270, baseQty: 32 },
        { name: "I bolt", weightPerPcKg: 0.240, baseQty: 24 },
    ],
    Bay: [
        { name: "Side Parling", weightPerPcKg: 20.210, baseQty: 2 },
        { name: "Centre Parling", weightPerPcKg: 20.210, baseQty: 1 },
        { name: "Patle Parling", weightPerPcKg: 10.700, baseQty: 12 },
        { name: "Tirpal Pipe", weightPerPcKg: 15.520, baseQty: 2 },
    ],
    Fabric: [
        { name: "Tirpal 30m", weightPerPcKg: 154.600, baseQty: 1 },
        { name: "Parde 4.5m", weightPerPcKg: 25.950, baseQty: 1 },
        { name: "D Set 30m", weightPerPcKg: 97.450, baseQty: 1 },
    ],
    Fasad: [
        { name: "Fasad Piller", weightPerPcKg: 20.160, baseQty: 5 },
        { name: "Fasad Top 14f", weightPerPcKg: 23.170, baseQty: 1 },
        { name: "Fasad Top 9f", weightPerPcKg: 15.300, baseQty: 2 },
        { name: "Fasad Top 1m", weightPerPcKg: 10.370, baseQty: 2 },
        { name: "Fasad Parling", weightPerPcKg: 20.210, baseQty: 6 },
    ],
    Others: [
        { name: "Cross Pipe", weightPerPcKg: 19.040, baseQty: 1 },
        { name: "Bracket", weightPerPcKg: 2.300, baseQty: 1 },
        { name: "Rassa", weightPerPcKg: null, baseQty: 1 },
        { name: "Hammer", weightPerPcKg: null, baseQty: 1 },
        { name: "Chabi pana", weightPerPcKg: null, baseQty: 1 },
        { name: "Line dori", weightPerPcKg: null, baseQty: 1 },
        { name: "Inch Tap", weightPerPcKg: null, baseQty: 1 },
        { name: "Safty belt", weightPerPcKg: null, baseQty: 1 },
        { name: "Safty Helmat", weightPerPcKg: null, baseQty: 1 },
        { name: "Balla Pipe", weightPerPcKg: null, baseQty: 1 },
        { name: "Rope wire", weightPerPcKg: 6.470, baseQty: 1 },
        { name: "Rajai Gadde", weightPerPcKg: null, baseQty: 1 },
        { name: "Sidi", weightPerPcKg: null, baseQty: 1 },
    ],
};

export function getPackageItems(
    category: PackageCategory,
    meter: MeterOption,
    qty: number
): CalculatedItem[] {
    if (qty <= 0) return [];

    const baseItems = BASE_PACKAGES[category] || [];
    const scale = SCALING_FACTORS[meter];

    return baseItems.map((item) => {
        // Logic: (BaseQty * Scale * QtySelected) rounded
        // Exception: If BaseQty is 1 (like distinct items in Others/Fabric), do we scale? 
        // Usually Fabric 30m scales to Fabric 40m. 
        // But "Hammer" in "Others" likely shouldn't scale with Meters, only with Qty of packages.
        // However, keeping simple scaling logic for now as per instructions.

        const totalQty = Math.round(item.baseQty * scale * qty);
        const totalWeight = item.weightPerPcKg !== null
            ? parseFloat((totalQty * item.weightPerPcKg).toFixed(2))
            : null;

        return {
            name: item.name,
            category,
            qty: totalQty,
            weightPerPc: item.weightPerPcKg,
            totalWeight,
            isCustom: false,
        };
    });
}

export function findItemWeight(name: string): number | null {
    for (const category of Object.values(BASE_PACKAGES)) {
        const found = category.find((item) => item.name.toLowerCase() === name.toLowerCase());
        if (found) return found.weightPerPcKg;
    }
    return null;
}
