const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const supabaseUrl = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8')
    .split('\n')
    .find(line => line.startsWith('NEXT_PUBLIC_SUPABASE_URL='))
    .split('=')[1];

const supabaseKey = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8')
    .split('\n')
    .find(line => line.startsWith('SUPABASE_SERVICE_ROLE_KEY='))
    .split('=')[1];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importPersonnel() {
    const csvPath = '/Users/bakralhayek/Library/CloudStorage/OneDrive-AdventHealth/Research/QI_Chief/Tracker Project/directory_rows.csv';

    if (!fs.existsSync(csvPath)) {
        console.error(`CSV file not found at ${csvPath}`);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(csvPath, 'utf8');

    Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            const data = results.data;
            console.log(`Parsed ${data.length} entries. Processing...`);

            // Prepare entries for upsert
            const entries = data.map(row => ({
                name: row.name.trim(),
                email: row.email.trim().toLowerCase(),
                role: row.role || 'Viewer'
            }));

            // In the DB, 'role' is an ENUM 'user_role' which might only have 'Operator' and 'Viewer'.
            // However, our types include 'Faculty' and 'Admin'.
            // We'll map them to the closest DB role or handle the ENUM update if it fails.

            const { error } = await supabase
                .from('directory')
                .upsert(entries, { onConflict: 'name' });

            if (error) {
                console.error('Error importing personnel:', error);

                // If it's a type error for the ENUM, we might need to update the enum.
                if (error.message.includes('invalid input value for enum user_role')) {
                    console.log('Detected ENUM mismatch. You may need to run:');
                    console.log("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Faculty';");
                    console.log("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Admin';");
                }
            } else {
                console.log(`Successfully imported ${entries.length} personnel entries.`);
            }
        }
    });
}

importPersonnel();
