import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { mergeDuplicateCategories } from "@/utils/migrationHelpers";

// --- Types ---

export type MeterOption = 10 | 15 | 20 | 25 | 30 | 40 | 50 | 60;
export const AVAILABLE_LENGTHS: MeterOption[] = [10, 15, 20, 25, 30, 40, 50, 60];

export type InventoryItem = {
    id: string;
    name: string;
    length: MeterOption; // Explicit length
    quantity: number;    // Explicit quantity for this length
    weightPerPcKg: number | null;
};

export type InventoryCategory = {
    id: string;
    name: string;
    items: InventoryItem[];
    supportedLengths: MeterOption[]; // Strictly typed now
};

export type InventoryDB = {
    version: number;
    categories: InventoryCategory[];
};

// --- Constants ---

const STORAGE_KEY = "jd_rentals_inventory_v1";
// Increment version to force migration/reset
const STORAGE_VERSION = 4;

// Seed Data
// We need to expand the original "Template Items" into explicit items for each length.
// Original scaling logic: 20m: 0.67, 30m: 1.0, 40m: 1.33, 50m: 1.67
// Default lengths usually supported: 20, 30, 40, 50

const BASE_LENGTHS: MeterOption[] = [30];

const generateItems = (baseName: string, weight: number | null, baseQty30m: number): InventoryItem[] => {
    return BASE_LENGTHS.map(len => {
        let scale = 1.0;
        if (len === 10) scale = 0.33;
        if (len === 15) scale = 0.5;
        if (len === 20) scale = 0.67;
        if (len === 25) scale = 0.83;
        if (len === 40) scale = 1.33;
        if (len === 50) scale = 1.67;
        if (len === 60) scale = 2.0;

        return {
            id: uuidv4(),
            name: baseName,
            length: len,
            quantity: Math.round(baseQty30m * scale) || 1,
            weightPerPcKg: weight
        };
    });
};

const SEED_DATA: InventoryCategory[] = [
    {
        id: "cat-ring",
        name: "Ring",
        supportedLengths: AVAILABLE_LENGTHS,
        items: [
            ...generateItems("Rafter 2 Patti", 55.31, 4),
            ...generateItems("Rafter 3 Patti", 56.92, 2),
            ...generateItems("Piller with Gulla", 53.99, 2),
            ...generateItems("Kanplate", 14.99, 4),
            ...generateItems("Base plate", 17.34, 2),
            ...generateItems("Alluminium Jointer", 13.28, 4),
            ...generateItems("V Jointer", 32.63, 1),
            ...generateItems("Side brasing", 24.29, 2),
            ...generateItems("Centre brasing", 18.26, 1),
            ...generateItems("Khunte", 3.26, 8),
            ...generateItems("Rachit belt", 1.47, 2),
            ...generateItems("Nut bolt", 0.27, 32),
            ...generateItems("I bolt", 0.24, 24),
        ]
    },
    {
        id: "cat-bay",
        name: "Bay",
        supportedLengths: AVAILABLE_LENGTHS,
        items: [
            ...generateItems("Side Parling", 20.21, 2),
            ...generateItems("Centre Parling", 20.21, 1),
            ...generateItems("Patle Parling", 10.7, 12),
            ...generateItems("Tirpal Pipe", 15.52, 2),
        ]
    },
    {
        id: "cat-fabric",
        name: "Fabric",
        supportedLengths: AVAILABLE_LENGTHS,
        items: [
            ...generateItems("Tirpal", 154.6, 1),
            ...generateItems("Parde 4.5m", 25.95, 1),
            ...generateItems("D Set 30m", 97.45, 1),
        ]
    },
    {
        id: "cat-fasad",
        name: "Fasad",
        supportedLengths: AVAILABLE_LENGTHS,
        items: [
            ...generateItems("Fasad Piller", 20.16, 5),
            ...generateItems("Fasad Top 14f", 23.17, 1),
            ...generateItems("Fasad Top 9f", 15.3, 2),
            ...generateItems("Fasad Top 1m", 10.37, 2),
            ...generateItems("Fasad Parling", 20.21, 6),
        ]
    },
    {
        id: "cat-others",
        name: "Others",
        supportedLengths: AVAILABLE_LENGTHS,
        items: [
            ...generateItems("Cross Pipe", 19.04, 1),
            ...generateItems("Bracket", 2.3, 1),
            ...generateItems("Rassa", null, 1),
            ...generateItems("Hammer", null, 1),
            ...generateItems("Chabi pana", null, 1),
            ...generateItems("Line dori", null, 1),
            ...generateItems("Inch Tap", null, 1),
            ...generateItems("Safty belt", null, 1),
            ...generateItems("Safty Helmat", null, 1),
            ...generateItems("Balla Pipe", null, 1),
            ...generateItems("Rope wire", 6.47, 1),
            ...generateItems("Rajai Gadde", null, 1),
            ...generateItems("Sidi", null, 1),
        ]
    },
];

// --- Hook ---

export function useInventory() {
    const [categories, setCategories] = useState<InventoryCategory[]>([]);
    const [loading, setLoading] = useState(true);
    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed: InventoryDB = JSON.parse(stored);
                if (parsed.version === STORAGE_VERSION) {
                    // Migration: Merge duplicates on load
                    const merged = mergeDuplicateCategories(parsed.categories);
                    setCategories(merged);
                } else {
                    // Reset if version mismatch
                    seedData();
                }
            } catch (e) {
                console.error("Failed to parse inventory", e);
                seedData();
            }
        } else {
            seedData();
        }
        setLoading(false);
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        if (!loading) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                version: STORAGE_VERSION,
                categories
            }));
        }
    }, [categories, loading]);

    const seedData = () => {
        // Also ensure seed data is merged just in case
        setCategories(mergeDuplicateCategories(SEED_DATA));
    };

    // --- Actions ---

    const addCategory = (name: string, supportedLengths: MeterOption[] = [20, 30, 40, 50]): { success: boolean, message?: string } => {
        const normalizedName = name.trim();
        const existingCat = categories.find(c => c.name.toLowerCase() === normalizedName.toLowerCase());

        if (existingCat) {
            // Merge logic
            const currentLengths = new Set(existingCat.supportedLengths || []);
            const newLengthsToAdd = supportedLengths.filter(l => !currentLengths.has(l));

            if (newLengthsToAdd.length === 0) {
                return { success: false, message: `Category "${existingCat.name}" already supports these lengths.` };
            }

            const updatedLengths = [...existingCat.supportedLengths, ...newLengthsToAdd].sort((a, b) => a - b);

            setCategories((prev) =>
                prev.map((cat) => (cat.id === existingCat.id ? { ...cat, supportedLengths: updatedLengths } : cat))
            );

            return { success: true, message: `Merged new lengths into existing category "${existingCat.name}".` };
        }

        const newCat: InventoryCategory = {
            id: uuidv4(),
            name: normalizedName,
            items: [],
            supportedLengths,
        };
        setCategories((prev) => [...prev, newCat]);
        return { success: true };
    };


    const updateCategory = (id: string, name: string) => {
        setCategories((prev) =>
            prev.map((cat) => (cat.id === id ? { ...cat, name } : cat))
        );
    };

    const deleteCategory = (id: string) => {
        setCategories((prev) => prev.filter((cat) => cat.id !== id));
    };

    const updateCategoryLengths = (id: string, lengths: MeterOption[]) => {
        setCategories((prev) =>
            prev.map((cat) => (cat.id === id ? { ...cat, supportedLengths: lengths } : cat))
        );
    };

    const addItem = (categoryId: string, item: Omit<InventoryItem, "id">) => {
        const newItem: InventoryItem = { ...item, id: uuidv4() };
        setCategories((prev) =>
            prev.map((cat) =>
                cat.id === categoryId
                    ? { ...cat, items: [...cat.items, newItem] }
                    : cat
            )
        );
    };

    const updateItem = (categoryId: string, itemId: string, updates: Partial<InventoryItem>) => {
        setCategories((prev) =>
            prev.map((cat) =>
                cat.id === categoryId
                    ? {
                        ...cat,
                        items: cat.items.map((item) =>
                            item.id === itemId ? { ...item, ...updates } : item
                        ),
                    }
                    : cat
            )
        );
    };

    const deleteItem = (categoryId: string, itemId: string) => {
        setCategories((prev) =>
            prev.map((cat) =>
                cat.id === categoryId
                    ? { ...cat, items: cat.items.filter((item) => item.id !== itemId) }
                    : cat
            )
        );
    };

    const importData = (jsonString: string) => {
        try {
            const parsed = JSON.parse(jsonString);
            if (Array.isArray(parsed.categories)) {
                setCategories(parsed.categories);
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    };

    const exportData = () => {
        const db: InventoryDB = {
            version: STORAGE_VERSION,
            categories,
        };
        return JSON.stringify(db, null, 2);
    };

    const resetToDefault = () => {
        seedData();
    }

    const getAllKnownItems = (): InventoryItem[] => {
        const allItems = new Map<string, InventoryItem>();
        categories.forEach(cat => {
            cat.items.forEach(item => {
                const key = item.name.trim().toLowerCase();
                if (!allItems.has(key)) {
                    allItems.set(key, item);
                }
            });
        });
        return Array.from(allItems.values());
    };

    return {
        categories,
        loading,
        addCategory,
        updateCategory,
        updateCategoryLengths,
        deleteCategory,
        addItem,
        updateItem,
        deleteItem,
        importData,
        exportData,
        resetToDefault,
        getAllKnownItems
    };
}
