import { type InventoryCategory, type MeterOption } from "@/store/inventoryStore";

export function mergeDuplicateCategories(categories: InventoryCategory[]): InventoryCategory[] {
    const mergedMap = new Map<string, InventoryCategory>();

    // Sort to ensure deterministic merging? Or just order of appearance.
    // Order of appearance is safer for ID preservation of the "first" one.

    categories.forEach(cat => {
        const key = cat.name.trim().toLowerCase();

        if (mergedMap.has(key)) {
            const existing = mergedMap.get(key)!;

            // Merge supportedLengths
            const mergedLengths = Array.from(new Set([
                ...(existing.supportedLengths || []),
                ...(cat.supportedLengths || [])
            ])).sort((a, b) => a - b) as MeterOption[];

            // Merge Items
            // ID conflict? If items have same ID, that would be weird but bad. 
            // Assuming unique item IDs across global store.
            const existingItems = Array.isArray(existing.items) ? existing.items : [];
            const newItems = Array.isArray(cat.items) ? cat.items : [];
            const mergedItems = [...existingItems, ...newItems];

            mergedMap.set(key, {
                ...existing,
                supportedLengths: mergedLengths,
                items: mergedItems
            });
        } else {
            mergedMap.set(key, { ...cat, name: cat.name.trim() }); // Normalize name trim
        }
    });

    return Array.from(mergedMap.values());
}
