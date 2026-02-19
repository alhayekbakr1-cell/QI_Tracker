/**
 * Environment Variable Validator
 * 
 * Ensures all required environment variables are present before build.
 * Run this in pre-build or as a standalone check.
 */

const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'GOOGLE_GENERATIVE_AI_API_KEY'
];

function validate() {
    console.log('🔍 Validating Environment Variables...');
    const missing = [];

    for (const v of requiredVars) {
        if (!process.env[v]) {
            missing.push(v);
        }
    }

    if (missing.length > 0) {
        console.error('❌ MISING REQUIRED ENVIRONMENT VARIABLES:');
        missing.forEach(v => console.error(`   - ${v}`));
        console.error('\nPlease check your .env.local file or GitHub Secrets.');
        process.exit(1);
    }

    console.log('✅ All required variables present.');
}

validate();
