/**
 * Normalizes an item name for consistent comparison.
 * Trims whitespace, converts to lowercase, and replaces multiple spaces with single space.
 */
export function normalizeItemName(name: string): string {
    if (!name) return "";
    return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}
