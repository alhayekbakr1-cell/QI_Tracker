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
// We need Service Role to fix data, but we should also test Anon Key for permissions
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !serviceKey) {
    console.error("Missing Service Role Key.");
    process.exit(1);
}

const adminSupabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const anonSupabase = createClient(url, anonKey, { auth: { persistSession: false } });

async function run() {
    console.log("--- NUDGE SYSTEM AUDIT & FIX ---");

    // 1. Validating Public Access (RLS)
    console.log("\n1. Testing Public Access (Anon Key)...");
    const { data: publicTest, error: publicError } = await anonSupabase
        .from('directory')
        .select('count')
        .limit(1)
        .single();

    if (publicError) {
        console.error("❌ CRITICAL: Public access failed!", publicError.message);
        console.log("   The Nudge button will fail for logged-out/anon users.");
    } else {
        console.log("✅ Public access confirmed. RLS policies are correct.");
    }

    // 2. Fetching Data
    console.log("\n2. scanning all projects...");
    const { data: directory, error: dirError } = await adminSupabase.from('directory').select('*');
    const { data: projects, error: projError } = await adminSupabase.from('projects').select('*');

    if (dirError || projError) {
        console.error("Error fetching data:", dirError || projError);
        return;
    }

    const dirMap = new Map();
    // Map "name" -> email
    // Also map "name without credentials" -> email (for fuzzy matching)
    directory.forEach(d => {
        dirMap.set(d.name.toLowerCase(), d);

        // Create simplified keys for fuzzy matching
        // e.g. "Nasar Khan MD" -> "nasar khan"
        const simplified = d.name.toLowerCase().replace(/ md| do| mbbs|,/g, '').trim();
        if (simplified.length > 3) {
            dirMap.set(simplified, d);
        }
    });

    const fixes = [];

    projects.forEach(p => {
        if (!p.lead_proponents || p.lead_proponents.length === 0) return;

        const originalLeads = [...p.lead_proponents];
        let needsUpdate = false;
        const updatedLeads = originalLeads.map(lead => {
            const lowerLead = lead.trim().toLowerCase();

            // Exact match?
            if (directory.find(d => d.name.toLowerCase() === lowerLead)) {
                return lead; // All good
            }

            // Mismatch! Try to find a fix.
            // 1. Try adding MD/DO
            const matchMD = directory.find(d => d.name.toLowerCase() === `${lowerLead} md`);
            if (matchMD) {
                console.log(`  Mismatch found: "${lead}" -> Resolving to "${matchMD.name}"`);
                needsUpdate = true;
                return matchMD.name;
            }

            const matchDO = directory.find(d => d.name.toLowerCase() === `${lowerLead} do`);
            if (matchDO) {
                console.log(`  Mismatch found: "${lead}" -> Resolving to "${matchDO.name}"`);
                needsUpdate = true;
                return matchDO.name;
            }

            // 2. Fuzzy Map check
            const simplifiedSelf = lowerLead.replace(/ md| do| mbbs|,/g, '').trim();
            const fuzzyMatch = dirMap.get(simplifiedSelf);
            if (fuzzyMatch) {
                console.log(`  Mismatch found: "${lead}" -> Resolving to "${fuzzyMatch.name}"`);
                needsUpdate = true;
                return fuzzyMatch.name;
            }

            console.log(`  ⚠️  UNRESOLVED MISMATCH: Project "${p.title}" Lead "${lead}" not found in directory.`);
            return lead;
        });

        if (needsUpdate) {
            fixes.push({
                id: p.id,
                title: p.title,
                lead_proponents: updatedLeads
            });
        }
    });

    // 3. Applying Fixes
    if (fixes.length > 0) {
        console.log(`\n3. Applying ${fixes.length} fixes automatically...`);
        for (const fix of fixes) {
            const { error } = await adminSupabase
                .from('projects')
                .update({ lead_proponents: fix.lead_proponents })
                .eq('id', fix.id);

            if (error) console.error(`   Failed to update "${fix.title}":`, error.message);
            else console.log(`   ✅ Fixed "${fix.title}"`);
        }
    } else {
        console.log("\n3. No data fixes needed. Names match directory.");
    }

    console.log("\n--- AUDIT COMPLETE ---");
}

run();
