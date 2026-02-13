const fs = require('fs');

const AVAILABLE_LENGTHS = [20, 30, 40, 50]; // Default supported lengths
const GENERATE_LENGTHS = [20, 30, 40, 50];

const generateItems = (baseName, weight, baseQty30m) => {
    return GENERATE_LENGTHS.map(len => {
        let scale = 1.0;
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

let sql = `-- Seed Data Migration\n\n`;

sql += `DO $$\nDECLARE\n    v_cat_id UUID;\nBEGIN\n`;

// Clear existing data to avoid sync issues or duplicate keys if re-run (optional, maybe dangerous? Safe for seed script)\n
// sql += `    -- DELETE FROM public.inventory_items;\n`;
// sql += `    -- DELETE FROM public.inventory_categories;\n\n`;

SEED_DATA_TEMPLATE.forEach(cat => {
    sql += `    -- Category: ${cat.name}\n`;
    sql += `    INSERT INTO public.inventory_categories (name, supported_lengths) VALUES ('${cat.name}', '[${AVAILABLE_LENGTHS.join(',')}]'::jsonb) RETURNING id INTO v_cat_id;\n`;

    cat.items.forEach(item => {
        const weight = item.weightPerPcKg === null ? 'NULL' : item.weightPerPcKg;
        sql += `    INSERT INTO public.inventory_items (category_id, name, length, quantity, weight_per_pc_kg) VALUES (v_cat_id, '${item.name}', ${item.length}, ${item.quantity}, ${weight});\n`;
    });
    sql += `\n`;
});

sql += `END $$;\n`;

console.log(sql);
