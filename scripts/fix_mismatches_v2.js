const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read env for keys
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

// Mismatches detected by diagnostic script
const mismatches = [
    {
        "projectId": "b270e099-125b-40c8-b3a1-b5b4d6c89b2f",
        "projectTitle": "CLEAR-RADS: Indication Improvement",
        "currentLead": "Nasar Khan",
        "suggestion": "Nasar Khan MD"
    }
];

async function runFix() {
    console.log("--- APPLYING fixes ---");

    for (const item of mismatches) {
        console.log(`Fixing project: ${item.projectTitle}`);

        // 1. Fetch current project to be safe
        const { data: project, error: fetchError } = await supabase
            .from('projects')
            .select('lead_proponents')
            .eq('id', item.projectId)
            .single();

        if (fetchError) {
            console.error(`  Error fetching project: ${fetchError.message}`);
            continue;
        }

        // 2. Modify specific lead name
        const updatedLeads = project.lead_proponents.map(lead => {
            return lead === item.currentLead ? item.suggestion : lead;
        });

        // 3. Update DB
        const { error: updateError } = await supabase
            .from('projects')
            .update({ lead_proponents: updatedLeads })
            .eq('id', item.projectId);

        if (updateError) {
            console.error(`  Failed to update: ${updateError.message}`);
        } else {
            console.log(`  SUCCESS: Updated "${item.currentLead}" -> "${item.suggestion}"`);
        }
    }
}

runFix();
