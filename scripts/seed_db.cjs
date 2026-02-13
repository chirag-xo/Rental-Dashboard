const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vnycxmoizykhrpdzjbmw.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZueWN4bW9penlraHJwZHpqYm13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYzNTY3NSwiZXhwIjoyMDg2MjExNjc1fQ.sV7AtKBAI1bUItziI54M54ybQCQOT7w_Z21sJxoz4ME";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const AVAILABLE_LENGTHS = [10, 15, 20, 25, 30, 40, 50, 60];

// Seed generator logic
const BASE_LENGTHS = [30];
const generateItems = (baseName, weight, baseQty30m) => {
    return BASE_LENGTHS.map(len => {
        // Generate for all lengths based on the 30m base
        const lens = [10, 15, 20, 25, 30, 40, 50, 60];
        return lens.map(l => {
            let scale = 1.0;
            if (l === 10) scale = 10 / 30; // 0.33
            if (l === 15) scale = 15 / 30; // 0.5
            if (l === 20) scale = 20 / 30; // 0.67
            if (l === 25) scale = 25 / 30; // 0.83
            if (l === 30) scale = 30 / 30; // 1.0
            if (l === 40) scale = 40 / 30; // 1.33
            if (l === 50) scale = 50 / 30; // 1.67
            if (l === 60) scale = 60 / 30; // 2.0

            return {
                name: baseName,
                length: l,
                quantity: Math.round(baseQty30m * scale) || 1,
                weightPerPcKg: weight
            };
        });
    }).flat();
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

async function seed() {
    console.log("Starting seed process...");

    for (const cat of SEED_DATA_TEMPLATE) {
        console.log(`Processing category: ${cat.name}`);

        // 1. Check or Create Category
        let catId;
        const { data: existingCat } = await supabase
            .from('inventory_categories')
            .select('id')
            .eq('name', cat.name)
            .single();

        if (existingCat) {
            console.log(`  - Found existing category: ${cat.name}`);
            catId = existingCat.id;

            // Update supported_lengths ensuring all are present
            await supabase
                .from('inventory_categories')
                .update({ supported_lengths: AVAILABLE_LENGTHS })
                .eq('id', catId);
        } else {
            const { data: newCat, error } = await supabase
                .from('inventory_categories')
                .insert({
                    name: cat.name,
                    supported_lengths: AVAILABLE_LENGTHS
                })
                .select('id')
                .single();

            if (error) {
                console.error(`  - Error creating category ${cat.name}:`, error);
                continue;
            }
            console.log(`  - Created category: ${cat.name}`);
            catId = newCat.id;
        }

        // 2. Insert Items
        let count = 0;
        for (const item of cat.items) {
            // Check if item exists (by name + length + category)
            const { count: existingItemCount } = await supabase
                .from('inventory_items')
                .select('*', { count: 'exact', head: true })
                .eq('category_id', catId)
                .eq('name', item.name)
                .eq('length', item.length);

            if (existingItemCount === 0) {
                const { error } = await supabase.from('inventory_items').insert({
                    category_id: catId,
                    name: item.name,
                    length: item.length,
                    quantity: item.quantity,
                    weight_per_pc_kg: item.weightPerPcKg
                });

                if (error) {
                    console.error(`    - Error inserting item ${item.name} (${item.length}m):`, error);
                } else {
                    count++;
                }
            }
        }
        console.log(`  - Added ${count} new items to ${cat.name}`);
    }
    console.log("Seeding complete.");
}

seed();
