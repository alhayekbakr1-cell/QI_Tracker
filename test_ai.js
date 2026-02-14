const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixthdiezadmpmyczmckf.supabase.co';
const supabaseKey = 'sb_publishable_qeekqrzKBBD_pP3UzGhBog_7-4E9vbt';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAI() {
    console.log('Testing AI function...');
    try {
        const { data, error } = await supabase.functions.invoke('qi-consultant', {
            body: { prompt: 'Translate "Hello World" to "Academic Professional QI Language" in one short phrase.' }
        });

        if (error) {
            console.error('Inference Error:', error);
            return;
        }

        console.log('Success! Response:', data);
    } catch (err) {
        console.error('Request failed:', err);
    }
}

testAI();
