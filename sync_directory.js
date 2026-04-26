
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Hardcoded keys for script execution
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncDirectory() {
    console.log('Reading directory_rows.csv...');
    const csvData = fs.readFileSync('directory_rows.csv', 'utf8');

    // Split lines and ignore header
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    const rows = lines.slice(1);

    console.log(`Found ${rows.length} records in CSV.`);

    let successCount = 0;

    for (const line of rows) {
        // Basic CSV splitting (assuming no commas in fields for now, as names/emails seem clean)
        // "id,name,email,created_at,role"
        const cols = line.split(',');
        if (cols.length < 5) continue;

        const id = cols[0].trim();
        const name = cols[1].trim();
        const email = cols[2].trim();
        // created_at = cols[3]
        const role = cols[4].trim();

        try {
            // Upsert into Supabase
            const { error } = await supabase
                .from('directory')
                .upsert({
                    id: id,
                    name: name,
                    email: email,
                    role: role
                    // Let created_at default or update if necessary, but usually immutable.
                }, { onConflict: 'name' });

            if (error) throw error;

            // console.log(`Synced: ${name}`);
            successCount++;
        } catch (err) {
            console.error(`Error syncing ${name}:`, err.message);
        }
    }

    console.log(`Sync Complete. Successfully processed: ${successCount} records.`);
}

syncDirectory();
