const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read env
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error("Missing Service Role Key.");
    process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function run() {
    console.log("--- DIAGNOSTIC START ---");

    // 1. Check Directory
    const { data: directory, error: dirError } = await supabase.from('directory').select('*');
    if (dirError) {
        console.error("Directory Error:", dirError.message);
        return;
    }
    console.log(`Directory: Found ${directory.length} entries.`);

    // 2. Check Projects
    const { data: projects, error: projError } = await supabase.from('projects').select('id, title, lead_proponents');
    if (projError) {
        console.error("Projects Error:", projError.message);
        return;
    }
    console.log(`Projects: Found ${projects.length} projects.`);

    // 3. Analyze Mismatches
    console.log("\n--- MISMATCH ANALYSIS ---");
    const dirNames = new Set(directory.map(d => d.name.toLowerCase()));
    const matches = [];
    const mismatches = [];

    projects.forEach(p => {
        if (!p.lead_proponents || p.lead_proponents.length === 0) return;

        p.lead_proponents.forEach(lead => {
            // Normalize comparison
            if (dirNames.has(lead.toLowerCase())) {
                matches.push(lead);
            } else {
                // Try to find a "fuzzy" match (e.g. add MD)
                const potential = directory.find(d => d.name.toLowerCase().includes(lead.toLowerCase()) || lead.toLowerCase().includes(d.name.toLowerCase()));

                mismatches.push({
                    projectId: p.id,
                    projectTitle: p.title,
                    currentLead: lead,
                    suggestion: potential ? potential.name : null
                });
            }
        });
    });

    console.log(`Matched Leads: ${matches.length}`);
    console.log(`Mismatched Leads: ${mismatches.length}`);

    if (mismatches.length > 0) {
        console.log("\n--- DETAILED MISMATCHES ---");
        mismatches.forEach(m => {
            console.log(`Project: "${m.projectTitle.substring(0, 30)}..."`);
            console.log(`  Current Lead: "${m.currentLead}"`);
            console.log(`  Suggestion:   "${m.suggestion || 'No match found'}"`);
            console.log("-");
        });

        // Output JSON for potential automated fix
        console.log("\n--- JSON OUTPUT FOR FIX ---");
        console.log(JSON.stringify(mismatches, null, 2));
    } else {
        console.log("\nALL LEADS MATCH DIRECTORY! ✅");
    }
}

run();
