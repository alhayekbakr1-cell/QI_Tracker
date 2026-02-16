const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const institutionalSecret = process.env.INSTITUTIONAL_SECRET;

const supabase = createClient(supabaseUrl, supabaseKey);

const PERSONNEL = [
    { email: 'Xiaowei.Malone.DO@AdventHealth.com', name: 'Xiaowei Malone DO', role: 'Viewer' },
    { email: 'Lidetu.Kayamo.MD@AdventHealth.com', name: 'Lidetu Kayamo MD', role: 'Viewer' },
    { email: 'Muhammad.Umar@AdventHealth.com', name: 'Muhammad Umar MD', role: 'Viewer' },
    { email: 'Muhammad.Anwar.MD@AdventHealth.com', name: 'Muhammad Anwar MD', role: 'Operator' },
    { email: 'JoaoVictor.SouzaPeres.DO@AdventHealth.com', name: 'JoaoVictor SouzaPeres DO', role: 'Viewer' },
    { email: 'anees.ahmad@adventhealth.com', name: 'Anees Ahmad MD', role: 'Viewer' },
    { email: 'Christopher.Yanichko.DO@AdventHealth.com', name: 'Christopher Yanichko DO', role: 'Operator' },
    { email: 'Ali.Mashadi.MD@AdventHealth.com', name: 'Ali Mashadi MD', role: 'Viewer' },
    { email: 'tiagpaul.bhamber.md@adventhealth.com', name: 'Tiagpaul Bhamber MD', role: 'Viewer' },
    { email: 'Bakr.Alhayek.MD@AdventHealth.com', name: 'Bakr Alhayek MD', role: 'Admin' },
    { email: 'Rebekah Alison.DO@AdventHealth.com', name: 'Rebekah Alison DO', role: 'Viewer' },
    { email: 'Muhammad.Ahmad.MD@AdventHealth.com', name: 'Muhammad Ahmad MD', role: 'Viewer' },
    { email: 'NagaManeesh.Komireddy.MD@AdventHealth.com', name: 'NagaManeesh Komireddy MD', role: 'Viewer' },
    { email: 'Reynaldo.ReynosoFigueroa.MD@AdventHealth.com', name: 'Reynaldo ReynosoFigueroa MD', role: 'Viewer' },
    { email: 'muhammadaffan.rashid.md@adventhealth.com', name: 'MuhammadAffan Rashid MD', role: 'Viewer' },
    { email: 'fnu.naina.md@adventhealth.com', name: 'Fnu Naina MD', role: 'Viewer' },
    { email: 'Mounica.Banala.MD@AdventHealth.com', name: 'Mounica Banala MD', role: 'Operator' },
    { email: 'Carlos.SantosDeJesus.MD@AdventHealth.com', name: 'Carlos SantosDeJesus MD', role: 'Operator' },
    { email: 'Bilal.Khan.MD@AdventHealth.com', name: 'Bilal Khan MD', role: 'Viewer' },
    { email: 'CLAUDIA.KROKERBODE.MD@AdventHealth.com', name: 'Claudia Kroker-Bode MD', role: 'Operator' },
    { email: 'rohitkumar.maheshwari.md@adventhealth.com', name: 'RohitKumar Maheshwari MD', role: 'Viewer' },
    { email: 'vipul.reddy.md@adventhealth.com', name: 'Vipul Reddy MD', role: 'Viewer' },
    { email: 'Ryan.Brink.DO@AdventHealth.com', name: 'Ryan Brink DO', role: 'Operator' },
    { email: 'abdulmueezalam.kayani.md@adventhealth.com', name: 'AbdulMueezAlam Kayani MD', role: 'Viewer' },
    { email: 'Jahid.Wahabzai.MD@AdventHealth.com', name: 'Jahid Wahabzai MD', role: 'Viewer' },
    { email: 'RajaRamesh.Gummalla.MD@AdventHealth.com', name: 'RajaRamesh Gummalla MD', role: 'Operator' },
    { email: 'Ariba.Khan.MD@AdventHealth.com', name: 'Ariba Khan MD', role: 'Viewer' },
    { email: 'Asha.Ramsakal.DO@AdventHealth.com', name: 'Asha Ramsakal DO', role: 'Operator' },
    { email: 'mahmoud.abdalla.md@adventhealth.com', name: 'Mahmoud Abdalla MD', role: 'Viewer' },
    { email: 'Aqsa.Khan.MD@AdventHealth.com', name: 'Aqsa Khan MD', role: 'Viewer' },
    { email: 'joelianandrew.mislay.md@adventhealth.com', name: 'JoelianAndrew Mislay MD', role: 'Viewer' },
    { email: 'Faheem.Ahmad.MD@AdventHealth.com', name: 'Faheem Ahmad MD', role: 'Operator' },
    { email: 'Ramish.Rafay.MD@AdventHealth.com', name: 'Ramish Rafay MD', role: 'Viewer' },
    { email: 'Amro.Idilbi.MD@AdventHealth.com', name: 'Amro Idilbi MD', role: 'Viewer' },
    { email: 'Aqsa.Saleem.MD@AdventHealth.com', name: 'Aqsa Saleem MD', role: 'Viewer' },
    { email: 'Lidia.SepulvedaRubiera.MD@AdventHealth.com', name: 'Lidia SepulvedaRubiera MD', role: 'Operator' },
    { email: 'Sara.Bibi.MD@AdventHealth.com', name: 'Sara Bibi MD', role: 'Operator' },
    { email: 'haniya.waseem.md@adventhealth.com', name: 'Haniya Waseem MD', role: 'Viewer' },
    { email: 'Hamood.Chaudhry.MD@AdventHealth.com', name: 'Hamood Chaudhry MD', role: 'Viewer' },
    { email: 'Diya.Asad.MD@AdventHealth.com', name: 'Diya Asad MD', role: 'Viewer' },
    { email: 'Yaseen.Dhemesh.MD@AdventHealth.com', name: 'Yaseen Dhemesh MD', role: 'Viewer' },
    { email: 'Muhammad.Umair.MD@AdventHealth.com', name: 'Muhammad Umair MD', role: 'Viewer' },
    { email: 'Ben.Baang.MD@AdventHealth.com', name: 'Ben Baang MD', role: 'Viewer' },
    { email: 'Iktimal.Alwan.MD@AdventHealth.com', name: 'Iktimal Alwan MD', role: 'Viewer' },
    { email: 'mahnoor.anjum.md@adventhealth.com', name: 'Mahnoor Anjum MD', role: 'Viewer' },
    { email: 'orlando.telleria.do@adventhealth.com', name: 'Orlando Telleria DO', role: 'Viewer' },
    { email: 'Sahil.Raj.MD@AdventHealth.com', name: 'Sahil Raj MD', role: 'Viewer' },
    { email: 'Rizwan.Khawaja.DO@AdventHealth.com', name: 'Rizwan Khawaja DO', role: 'Viewer' },
    { email: 'John.Haffey.DO@AdventHealth.com', name: 'John Haffey DO', role: 'Viewer' },
    { email: 'nasar.khan.md@adventhealth.com', name: 'Nasar Khan MD', role: 'Viewer' },
    { email: 'James.Vernace@AdventHealth.com', name: 'James Vernace', role: 'Operator' },
    { email: 'Anna.Hadid.MD@AdventHealth.com', name: 'Anna Hadid MD', role: 'Operator' },
];

async function syncRoles() {
    console.log(`Starting synchronization for ${PERSONNEL.length} users...`);

    for (const person of PERSONNEL) {
        const email = person.email.toLowerCase();
        const { name, role } = person;

        console.log(`Processing: ${email} (${name}) -> ${role}`);

        // 1. Find user in auth.users
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
            console.error('Error listing users:', authError);
            break;
        }

        let user = users.find(u => u.email.toLowerCase() === email);

        if (!user) {
            // Register new user
            console.log(`Registering new user: ${email}`);
            const { data: newUser, error: regError } = await supabase.auth.admin.createUser({
                email,
                password: institutionalSecret,
                email_confirm: true,
                user_metadata: { full_name: name }
            });

            if (regError) {
                console.error(`Failed to register ${email}:`, regError.message);
                continue;
            }
            user = newUser.user;
        } else {
            // Update existing user password and metadata
            console.log(`Updating existing user: ${email}`);
            const { error: updError } = await supabase.auth.admin.updateUserById(user.id, {
                password: institutionalSecret,
                user_metadata: { full_name: name }
            });

            if (updError) {
                console.error(`Failed to update auth for ${email}:`, updError.message);
            }
        }

        // 2. Sync profile role
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                full_name: name,
                role: role
            }, { onConflict: 'id' });

        if (profileError) {
            console.error(`Failed to sync profile for ${email}:`, profileError.message);
        } else {
            console.log(`Successfully synced ${email} ✅`);
        }
    }

    console.log('Synchronization complete! 🏁');
}

syncRoles();
