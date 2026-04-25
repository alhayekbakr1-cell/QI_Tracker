// Static export: no server-side Supabase. Re-export the browser client.
// All auth is handled client-side in this GitHub Pages deployment.
export { createClient } from './client'
