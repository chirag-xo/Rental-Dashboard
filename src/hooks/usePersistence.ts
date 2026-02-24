import { useState, useEffect } from "react";
// import { z } from "zod";

const STORAGE_KEY = "jd_calc_v1";

// Define schema for validation
// Define schema for validation (Unused for now but good for ref)
// const SelectionSchema = z.object({
//   Ring: z.object({ meter: z.number(), qty: z.number() }).optional(),
//   Bay: z.object({ meter: z.number(), qty: z.number() }).optional(),
//   Fabric: z.object({ meter: z.number(), qty: z.number() }).optional(),
//   Others: z.object({ meter: z.number(), qty: z.number() }).optional(),
//   Fasad: z.object({ meter: z.number(), qty: z.number() }).optional(),
// });

export type SelectionItem = {
    id: string;
    meter: number;
    qty: number;
};

export type SelectionState = {
    [category: string]: SelectionItem[];
};

export type CustomItem = {
    id: string;
    name: string;
    qty: number;
    weightPerPc: number;
    length?: number; // Optional for backward compatibility (MeterOption: 10 | 15 | 20 | 25 | 30 | 40 | 50 | 60)
};

export type ItemOverride = {
    qty?: number;
    weightPerPc?: number;
    removed?: boolean;
};

type PersistedData = {
    selection: SelectionState;
    customItems: CustomItem[];
    directItems: CustomItem[]; // New: Step 1 direct items
    overrides: Record<string, ItemOverride>;
};

export function usePersistence() {
    const [data, setData] = useState<PersistedData>({
        selection: {},
        customItems: [],
        directItems: [], // Init empty
        overrides: {},
    });

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === "object") {
                    // Ensure directItems exists regarding old data
                    if (!parsed.directItems) parsed.directItems = [];

                    // MIGRATION: Convert old object-based selection to array-based
                    if (parsed.selection) {
                        const migratedSelection: SelectionState = {};
                        Object.entries(parsed.selection).forEach(([key, val]) => {
                            // Check if val is already an array (new format) vs object (old format)
                            if (Array.isArray(val)) {
                                migratedSelection[key] = val as SelectionItem[];
                            } else {
                                // Old format: { meter: 30, qty: 1 }
                                // Convert to array: [{ id: "default", meter: 30, qty: 1 }]
                                const oldVal = val as { meter: number; qty: number };
                                migratedSelection[key] = [{
                                    id: "default-legacy",
                                    meter: oldVal.meter,
                                    qty: oldVal.qty
                                }];
                            }
                        });
                        parsed.selection = migratedSelection;
                    }

                    setData(parsed);
                }
            }
        } catch (e) {
            console.error("Failed to load persistence", e);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    const saveState = (newState: Partial<PersistedData>) => {
        setData((prev) => {
            const next = { ...prev, ...newState };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    };

    const clearState = () => {
        localStorage.removeItem(STORAGE_KEY);
        setData({ selection: {}, customItems: [], directItems: [], overrides: {} });
    };

    return { data, saveState, clearState, isLoaded };
}
