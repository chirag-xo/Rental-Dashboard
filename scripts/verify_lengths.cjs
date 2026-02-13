const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vnycxmoizykhrpdzjbmw.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZueWN4bW9penlraHJwZHpqYm13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYzNTY3NSwiZXhwIjoyMDg2MjExNjc1fQ.sV7AtKBAI1bUItziI54M54ybQCQOT7w_Z21sJxoz4ME";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verify() {
    console.log("Verifying categories...");
    const { data: categories, error } = await supabase
        .from('inventory_categories')
        .select('id, name, supported_lengths');

    if (error) {
        console.error("Error fetching categories:", error);
        return;
    }

    categories.forEach(cat => {
        console.log(`Category: ${cat.name}`);
        console.log(`  Supported Lengths: ${JSON.stringify(cat.supported_lengths)}`);
    });
}

verify();
