import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// --- Types ---

export type MeterOption = 10 | 15 | 20 | 25 | 30 | 40 | 50 | 60;
export const AVAILABLE_LENGTHS: MeterOption[] = [10, 15, 20, 25, 30, 40, 50, 60];

export type InventoryItem = {
    id: string;
    name: string;
    length: MeterOption;
    quantity: number;
    weightPerPcKg: number | null;
    category_id?: string; // Optional for UI, needed for DB
};

export type InventoryCategory = {
    id: string;
    name: string;
    items: InventoryItem[];
    supportedLengths: MeterOption[];
};

// --- Constants ---

// Seed Data for initial DB population
const BASE_LENGTHS: MeterOption[] = [30];

const generateItems = (baseName: string, weight: number | null, baseQty30m: number): Omit<InventoryItem, 'id'>[] => {
    return BASE_LENGTHS.map(len => {
        let scale = 1.0;
        // Simple scaling logic for seed
        if (len === 10) scale = 0.33;
        if (len === 15) scale = 0.5;
        if (len === 20) scale = 0.67;
        if (len === 25) scale = 0.83;
        if (len === 40) scale = 1.33;
        if (len === 50) scale = 1.67;
        if (len === 60) scale = 2.0;

        return {
            name: baseName,
            length: len,
            quantity: Math.round(baseQty30m * scale) || 1,
            weightPerPcKg: weight
        };
    });
};

const SEED_DATA_TEMPLATE = [
    {
        name: "Ring",
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
        name: "Bay",
        items: [
            ...generateItems("Side Parling", 20.21, 2),
            ...generateItems("Centre Parling", 20.21, 1),
            ...generateItems("Patle Parling", 10.7, 12),
            ...generateItems("Tirpal Pipe", 15.52, 2),
        ]
    },
    {
        name: "Fabric",
        items: [
            ...generateItems("Tirpal", 154.6, 1),
            ...generateItems("Parde 4.5m", 25.95, 1),
            ...generateItems("D Set 30m", 97.45, 1),
        ]
    },
    {
        name: "Fasad",
        items: [
            ...generateItems("Fasad Piller", 20.16, 5),
            ...generateItems("Fasad Top 14f", 23.17, 1),
            ...generateItems("Fasad Top 9f", 15.3, 2),
            ...generateItems("Fasad Top 1m", 10.37, 2),
            ...generateItems("Fasad Parling", 20.21, 6),
        ]
    },
    {
        name: "Others",
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

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Categories
            const { data: catData, error: catError } = await supabase
                .from('inventory_categories')
                .select('*')
                .order('name');

            if (catError) throw catError;

            // Fetch Items
            const { data: itemData, error: itemError } = await supabase
                .from('inventory_items')
                .select('*');

            if (itemError) throw itemError;

            // Map to local structure
            const cats: InventoryCategory[] = (catData || []).map(c => ({
                id: c.id,
                name: c.name,
                supportedLengths: (c.supported_lengths || []) as MeterOption[],
                items: []
            }));

            // Distribute items
            (itemData || []).forEach(i => {
                const cat = cats.find(c => c.id === i.category_id);
                if (cat) {
                    cat.items.push({
                        id: i.id,
                        name: i.name,
                        length: i.length as MeterOption,
                        quantity: i.quantity,
                        weightPerPcKg: i.weight_per_pc_kg,
                        category_id: i.category_id
                    });
                }
            });

            // If empty, seed
            // if (cats.length === 0) {
            //     await seedDatabase();
            //     return;
            // }

            setCategories(cats);

        } catch (err) {
            console.error("Error fetching inventory:", err);
        } finally {
            setLoading(false);
        }
    };

    const seedDatabase = async () => {
        console.log("Seeding Database...");

        // Use a loop to ensure sequential creation (categories first)
        for (const tmpl of SEED_DATA_TEMPLATE) {
            // Create Category
            const { data: cat, error } = await supabase
                .from('inventory_categories')
                .insert({
                    name: tmpl.name,
                    supported_lengths: AVAILABLE_LENGTHS
                })
                .select()
                .single();

            if (error || !cat) {
                console.error("Failed to seed category", tmpl.name, error);
                continue;
            }

            // Create Items
            // Note: DB expects snake_case columns
            const itemsToInsert = tmpl.items.map(i => ({
                category_id: cat.id,
                name: i.name,
                length: i.length,
                quantity: i.quantity,
                weight_per_pc_kg: i.weightPerPcKg
            }));

            const { error: itemError } = await supabase.from('inventory_items').insert(itemsToInsert);
            if (itemError) {
                console.error("Failed to seed items for", tmpl.name, itemError);
            }
        }
        await fetchData(); // Refresh
    };

    useEffect(() => {
        fetchData();

        // Subscription for realtime updates
        const channel = supabase.channel('inventory-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_categories' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);


    // --- Actions ---

    const addCategory = async (name: string, supportedLengths: MeterOption[] = [20, 30, 40, 50]): Promise<{ success: boolean, message?: string }> => {
        const normalizedName = name.trim();

        // Check duplication logic
        // We can't synchronously check categories unless we trust `categories` state, which is fine for UI feedback but eventual consistency might conflict.

        const existingCat = categories.find(c => c.name.toLowerCase() === normalizedName.toLowerCase());

        if (existingCat) {
            // Merge logic in DB
            const currentLengths = new Set(existingCat.supportedLengths || []);
            const newLengthsToAdd = supportedLengths.filter(l => !currentLengths.has(l));

            if (newLengthsToAdd.length === 0) {
                return { success: false, message: `Category "${existingCat.name}" already supports these lengths.` };
            }

            const updatedLengths = [...existingCat.supportedLengths, ...newLengthsToAdd].sort((a, b) => a - b);

            const { error } = await supabase
                .from('inventory_categories')
                .update({ supported_lengths: updatedLengths })
                .eq('id', existingCat.id);

            if (error) {
                console.error("Error updating category lengths", error);
                return { success: false, message: "Database error" };
            }

            return { success: true, message: `Merged new lengths into existing category "${existingCat.name}".` };
        }

        const { error } = await supabase
            .from('inventory_categories')
            .insert({
                name: normalizedName,
                supported_lengths: supportedLengths
            });

        if (error) {
            console.error("Error creating category", error);
            return { success: false, message: error.message };
        }

        return { success: true };
    };


    const updateCategory = async (id: string, name: string) => {
        await supabase
            .from('inventory_categories')
            .update({ name })
            .eq('id', id);
    };

    const deleteCategory = async (id: string) => {
        await supabase
            .from('inventory_categories')
            .delete()
            .eq('id', id);
    };

    const updateCategoryLengths = async (id: string, lengths: MeterOption[]) => {
        await supabase
            .from('inventory_categories')
            .update({ supported_lengths: lengths })
            .eq('id', id);
    };

    const addItem = async (categoryId: string, item: Omit<InventoryItem, "id">) => {
        const { error } = await supabase
            .from('inventory_items')
            .insert({
                category_id: categoryId,
                name: item.name,
                length: item.length,
                quantity: item.quantity,
                weight_per_pc_kg: item.weightPerPcKg
            });

        if (error) {
            console.error("Error adding item:", error);
            alert("Failed to add item: " + error.message);
        } else {
            await fetchData();
        }
    };

    const updateItem = async (_categoryId: string, itemId: string, updates: Partial<InventoryItem>) => {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
        if (updates.weightPerPcKg !== undefined) dbUpdates.weight_per_pc_kg = updates.weightPerPcKg;

        const { error } = await supabase
            .from('inventory_items')
            .update(dbUpdates)
            .eq('id', itemId);

        if (error) {
            console.error("Error updating item:", error);
            alert("Failed to update item: " + error.message);
        } else {
            await fetchData();
        }
    };

    const deleteItem = async (_categoryId: string, itemId: string) => {
        const { error } = await supabase
            .from('inventory_items')
            .delete()
            .eq('id', itemId);

        if (error) {
            console.error("Error deleting item:", error);
            alert("Failed to delete item: " + error.message);
        } else {
            // Optimistic update or refresh
            await fetchData();
        }
    };

    const importData = (_jsonString: string) => { return false; };
    const exportData = () => { return JSON.stringify(categories, null, 2); };

    const resetToDefault = async () => {
        if (!confirm("Are you sure? This will WIPE the database.")) return;
        // Delete items first as they reference categories
        await supabase.from('inventory_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('inventory_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await seedData(); // Wait for re-fetch will happen on seed
    };

    // Alias seedDatabase to seedData if needed internally or exposing it?
    // The interface expects resetToDefault to handle logic. 
    // Let's make sure seedData is available
    const seedData = seedDatabase;

    const migrateFromLocalStorage = async () => {
        const STORAGE_KEY = "jd_rentals_inventory_v1";
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return "No local data found.";

        try {
            const parsed = JSON.parse(stored);
            if (!parsed.categories || !Array.isArray(parsed.categories)) {
                return "Invalid local data format.";
            }

            let catsAdded = 0;
            let itemsAdded = 0;

            console.log("Starting migration...", parsed.categories.length, "categories found.");

            for (const cat of parsed.categories) {
                // 1. Ensure Category Exists
                let catId: string | null = null;

                // Check if exists
                const { data: existingCat } = await supabase
                    .from('inventory_categories')
                    .select('id, supported_lengths')
                    .ilike('name', cat.name.trim())
                    .single();

                if (existingCat) {
                    catId = existingCat.id;
                } else {
                    const { data: newCat, error } = await supabase
                        .from('inventory_categories')
                        .insert({
                            name: cat.name.trim(),
                            supported_lengths: cat.supportedLengths || AVAILABLE_LENGTHS
                        })
                        .select('id')
                        .single();

                    if (error || !newCat) {
                        console.error("Failed to migrate category", cat.name, error);
                        continue;
                    }
                    catId = newCat.id;
                    catsAdded++;
                }

                if (!catId) continue;

                // 2. Migrate Items
                for (const item of cat.items) {
                    // Check if exists in this category
                    const { count } = await supabase
                        .from('inventory_items')
                        .select('*', { count: 'exact', head: true })
                        .eq('category_id', catId)
                        .eq('name', item.name)
                        .eq('length', item.length);

                    if (count === 0) {
                        await supabase
                            .from('inventory_items')
                            .insert({
                                category_id: catId,
                                name: item.name,
                                length: item.length,
                                quantity: item.quantity,
                                weight_per_pc_kg: item.weightPerPcKg
                            });
                        itemsAdded++;
                    }
                }
            }

            await fetchData();
            return `Migration Complete. Added ${catsAdded} new categories and ${itemsAdded} items.`;

        } catch (e) {
            console.error("Migration failed", e);
            return "Migration failed. Check console locally.";
        }
    };

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
        getAllKnownItems,
        migrateFromLocalStorage
    };
}
