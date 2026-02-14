const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for admin update

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase variables in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function elevateToAdmin(email) {
    console.log(`Elevating ${email} to Admin...`);

    // First find the user ID in auth.users would be ideal, but we can just use the profiles table
    // since we know the email or can find it by partial match if needed.
    // Actually, let's just find the profile by full_name or email (if it exists)

    const { data: profiles, error: findError } = await supabase
        .from('profiles')
        .select('id, role')
        .or(`full_name.ilike.%${email.split('@')[0]}%`); // Simple heuristic

    if (findError) {
        console.error('Error finding profile:', findError);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.error('No profile found matching search criteria.');
        return;
    }

    const targetId = profiles[0].id;
    console.log(`Found profile: ${targetId}. Updating role to 'Admin'...`);

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'Admin' })
        .eq('id', targetId);

    if (updateError) {
        console.error('Error updating role:', updateError);
    } else {
        console.log('Successfully elevated user to Admin! ✅');
    }
}

// Based on workspace path: /Users/bakralhayek/...
elevateToAdmin('bakralhayek'); 
