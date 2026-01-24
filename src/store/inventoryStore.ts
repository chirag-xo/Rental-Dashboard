import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

// --- Types ---

export type MeterOption = 20 | 30 | 40 | 50;

export type InventoryItem = {
    id: string;
    name: string;
    defaultQty: number; // per 30m package
    qtyOverrides?: Record<number, number>; // Explicit quantities for specific lengths (20, 30, 40, 50)
    weightPerPcKg: number | null;
};

export type InventoryCategory = {
    id: string;
    name: string;
    items: InventoryItem[];
    supportedLengths?: number[]; // Added: defaults to [20, 30, 40, 50] if undefined
};

export type InventoryDB = {
    version: number;
    categories: InventoryCategory[];
};

// --- Constants ---

const STORAGE_KEY = "jd_rentals_inventory_v1";
const STORAGE_VERSION = 1;

// Seed Data (from original packages.ts)
const SEED_DATA: InventoryCategory[] = [
    {
        id: "cat-ring",
        name: "Ring",
        items: [
            { id: "item-ring-1", name: "Rafter 2 Patti", weightPerPcKg: 55.31, defaultQty: 4 },
            { id: "item-ring-2", name: "Rafter 3 Patti", weightPerPcKg: 56.92, defaultQty: 2 },
            { id: "item-ring-3", name: "Piller with Gulla", weightPerPcKg: 53.99, defaultQty: 2 },
            { id: "item-ring-4", name: "Kanplate", weightPerPcKg: 14.99, defaultQty: 4 },
            { id: "item-ring-5", name: "Base plate", weightPerPcKg: 17.34, defaultQty: 2 },
            { id: "item-ring-6", name: "Alluminium Jointer", weightPerPcKg: 13.28, defaultQty: 4 },
            { id: "item-ring-7", name: "V Jointer", weightPerPcKg: 32.63, defaultQty: 1 },
            { id: "item-ring-8", name: "Side brasing", weightPerPcKg: 24.29, defaultQty: 2 },
            { id: "item-ring-9", name: "Centre brasing", weightPerPcKg: 18.26, defaultQty: 1 },
            { id: "item-ring-10", name: "Khunte", weightPerPcKg: 3.26, defaultQty: 8 },
            { id: "item-ring-11", name: "Rachit belt", weightPerPcKg: 1.47, defaultQty: 2 },
            { id: "item-ring-12", name: "Nut bolt", weightPerPcKg: 0.27, defaultQty: 32 },
            { id: "item-ring-13", name: "I bolt", weightPerPcKg: 0.24, defaultQty: 24 },
        ],
    },
    {
        id: "cat-bay",
        name: "Bay",
        items: [
            { id: "item-bay-1", name: "Side Parling", weightPerPcKg: 20.21, defaultQty: 2 },
            { id: "item-bay-2", name: "Centre Parling", weightPerPcKg: 20.21, defaultQty: 1 },
            { id: "item-bay-3", name: "Patle Parling", weightPerPcKg: 10.7, defaultQty: 12 },
            { id: "item-bay-4", name: "Tirpal Pipe", weightPerPcKg: 15.52, defaultQty: 2 },
        ],
    },
    {
        id: "cat-fabric",
        name: "Fabric",
        items: [
            { id: "item-fabric-1", name: "Tirpal 30m", weightPerPcKg: 154.6, defaultQty: 1 },
            { id: "item-fabric-2", name: "Parde 4.5m", weightPerPcKg: 25.95, defaultQty: 1 },
            { id: "item-fabric-3", name: "D Set 30m", weightPerPcKg: 97.45, defaultQty: 1 },
        ],
    },
    {
        id: "cat-fasad",
        name: "Fasad",
        items: [
            { id: "item-fasad-1", name: "Fasad Piller", weightPerPcKg: 20.16, defaultQty: 5 },
            { id: "item-fasad-2", name: "Fasad Top 14f", weightPerPcKg: 23.17, defaultQty: 1 },
            { id: "item-fasad-3", name: "Fasad Top 9f", weightPerPcKg: 15.3, defaultQty: 2 },
            { id: "item-fasad-4", name: "Fasad Top 1m", weightPerPcKg: 10.37, defaultQty: 2 },
            { id: "item-fasad-5", name: "Fasad Parling", weightPerPcKg: 20.21, defaultQty: 6 },
        ],
    },
    {
        id: "cat-others",
        name: "Others",
        items: [
            { id: "item-others-1", name: "Cross Pipe", weightPerPcKg: 19.04, defaultQty: 1 },
            { id: "item-others-2", name: "Bracket", weightPerPcKg: 2.3, defaultQty: 1 },
            { id: "item-others-3", name: "Rassa", weightPerPcKg: null, defaultQty: 1 },
            { id: "item-others-4", name: "Hammer", weightPerPcKg: null, defaultQty: 1 },
            { id: "item-others-5", name: "Chabi pana", weightPerPcKg: null, defaultQty: 1 },
            { id: "item-others-6", name: "Line dori", weightPerPcKg: null, defaultQty: 1 },
            { id: "item-others-7", name: "Inch Tap", weightPerPcKg: null, defaultQty: 1 },
            { id: "item-others-8", name: "Safty belt", weightPerPcKg: null, defaultQty: 1 },
            { id: "item-others-9", name: "Safty Helmat", weightPerPcKg: null, defaultQty: 1 },
            { id: "item-others-10", name: "Balla Pipe", weightPerPcKg: null, defaultQty: 1 },
            { id: "item-others-11", name: "Rope wire", weightPerPcKg: 6.47, defaultQty: 1 },
            { id: "item-others-12", name: "Rajai Gadde", weightPerPcKg: null, defaultQty: 1 },
            { id: "item-others-13", name: "Sidi", weightPerPcKg: null, defaultQty: 1 },
        ],
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
                    setCategories(parsed.categories);
                } else {
                    // Handle migration if needed, for now just reset
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

    // Save to localStorage whenever categories change (but not on initial load)
    useEffect(() => {
        if (!loading && categories.length > 0) {
            const db: InventoryDB = {
                version: STORAGE_VERSION,
                categories,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        }
    }, [categories, loading]);

    const seedData = () => {
        setCategories(SEED_DATA);
    };

    // --- Actions ---

    const addCategory = (name: string) => {
        const newCat: InventoryCategory = {
            id: uuidv4(),
            name,
            items: [],
            supportedLengths: [20, 30, 40, 50], // Default to all
        };
        setCategories((prev) => [...prev, newCat]);
    };

    const updateCategory = (id: string, name: string) => {
        setCategories((prev) =>
            prev.map((cat) => (cat.id === id ? { ...cat, name } : cat))
        );
    };

    const deleteCategory = (id: string) => {
        setCategories((prev) => prev.filter((cat) => cat.id !== id));
    };

    const updateCategoryLengths = (id: string, lengths: number[]) => {
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
            // Basic validation
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
        resetToDefault
    };
}
