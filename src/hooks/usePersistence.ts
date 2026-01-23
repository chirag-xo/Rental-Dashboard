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

export type SelectionState = {
    [key: string]: { meter: number; qty: number };
};

export type CustomItem = {
    id: string;
    name: string;
    qty: number;
    weightPerPc: number;
};

type PersistedData = {
    selection: SelectionState;
    customItems: CustomItem[];
};

export function usePersistence() {
    const [data, setData] = useState<PersistedData>({
        selection: {},
        customItems: [],
    });

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === "object") {
                    // Basic validation could go here
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
        setData({ selection: {}, customItems: [] });
    };

    return { data, saveState, clearState, isLoaded };
}
