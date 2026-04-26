
const { createClient } = require('@supabase/supabase-js');

// Hardcoded keys for script execution
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Projects to Update (with potential shorthand/ambiguous names)
const projectsToUpdate = [
    {
        "title": "Smoking Cessation in Advent Health Internal Medicine Clinic",
        "leads": ["Baang"],
        "proponents": ["Malone", "Wahabzai", "Umar", "Mislay", "Chaudhry", "Kayamo", "Khawaja"],
        "faculty": "Dr. Vernace/Anwar"
    },
    {
        "title": "Prescription for MRAs in Heart Failure",
        "leads": ["Anjum"],
        "proponents": ["Abdalla"], // Cleaned (incomplete proponents)
        "faculty": null
    },
    {
        "title": "Cancer Pain QI Project ***",
        "leads": ["Dr Alhayek"],
        "proponents": ["Dr Malone", "Iktimal"],
        "faculty": "Dr Sepulveda/Dr. KB"
    },
    {
        "title": "Heart Failure Order Set QI Project",
        "leads": ["Dr Bilal Khan"],
        "proponents": ["Dr Ariba Khan", "Dr Nasar Khan"],
        "faculty": null
    },
    {
        "title": "Fostering a Culture of Verbal Engagement: A Quality Improvement Approach to Enhancing Resident Participation in Noon Conference\u00a0Case Presentations by\u00a0using a multimodal approach to pedagogy: The Novel C/S/D model +\u00a0\u201cDiagnostic Pause\u201d\u00a0integrated into\u00a0\u201cMorning Report\u201d style sessions.",
        "leads": ["Baang"],
        "proponents": ["Kayani", "Ahmad Muhammad", "Raj Sahil", "Asad", "Komireddy"],
        "faculty": "Dr. Anwar/Dr. Ramsakal"
    },
    {
        "title": "Iron Therapy in Heart Failure QI Project",
        "leads": ["Reddy"],
        "proponents": ["Bhamber", "Abdalla", "Anjum"],
        "faculty": "Dr. Agocha"
    },
    {
        "title": "\"Implementation of a Human Papilloma Virus (HPV) Vaccination Program in An Internal Medicine Resident Ambulatory Care Clinic (IMRAC)\"",
        "leads": ["Drs. Xiaowei Malone"],
        "proponents": ["Bakr Alhayek", "Aqsa Khan", "Rana Latoui."],
        "faculty": "Dr. Ramsakal"
    },
    {
        "title": "Diabetic Foot Exam QI Project",
        "leads": ["Ahmad Anees"],
        "proponents": ["Kayani", "Rashid", "Chaudhry"],
        "faculty": "Dr. Hadid and Dr. Anwar"
    },
    {
        "title": "SGLT2 inhibitors in Heart Failure QI Project",
        "leads": ["Bhamber"],
        "proponents": ["Reddy", "Abdalla", "Anjum"],
        "faculty": "Dr. Agocha"
    },
    {
        "title": "SGLT2/ACE/ARB inhibitors in CKD QI Project",
        "leads": ["Khan"], // Ambiguous!
        "proponents": ["Wahabzai", "Naga Maneesh Komireddy"],
        "faculty": "Dr. Hadid"
    },
    {
        "title": "Abdominal Aortic Aneurysm Screening QI Project",
        "leads": ["Mislay"],
        "proponents": ["Mashadi", "Baang", "Abdalla"],
        "faculty": null
    },
    {
        "title": "Microalbumin Creatinine Ratio QI Project",
        "leads": ["Rashid Muhammad"],
        "proponents": ["Ahmad Anees", "Kayani", "Aqsa Saleem", "Ahmad Muhammad"],
        "faculty": null
    },
    {
        "title": "Reducing unnecessary HIT screening in general medicine floors.",
        "leads": ["Alhayek Bakr"],
        "proponents": ["Claudia Peterman", "Bindiya", "Aqsa Saleem", "Reynaldo Reynoso"],
        "faculty": "Dr Sepulveda/Dr Gummalla"
    },
    {
        "title": "Hepatitis C Screening QI Project",
        "leads": ["Maheshwari"],
        "proponents": ["Baang", "Saleem", "Naina"],
        "faculty": null
    },
    {
        "title": "Pneumococcal Vaccine QI Project",
        "leads": ["M. Umair"],
        "proponents": ["M. Ahmad"],
        "faculty": null
    },
    {
        "title": "Low Dose CT Chest QI Project",
        "leads": ["Khan Ariba"],
        "proponents": ["Raj Sahil"],
        "faculty": "Dr. Ramsakal"
    },
    {
        "title": "Carvedilol QI Project",
        "leads": ["Dr Waseem"],
        "proponents": ["Naina", "Umair Muhammad", "Ahmad Muhammad", "Rafay Ramish"],
        "faculty": null
    },
    {
        "title": "COPD Discharge Bundle QI Project",
        "leads": ["Reynoso"],
        "proponents": [],
        "faculty": "Dr. Sepulveda"
    },
    {
        "title": "COPD Misdiagnosis QI Project",
        "leads": ["Khawaja"],
        "proponents": ["Reynoso", "Baang"],
        "faculty": "Dr. Menezes"
    },
    {
        "title": "Sepsis: Time to Administration of Abx. QI Project",
        "leads": ["Idilbi"],
        "proponents": ["Khawaja", "Reynoso"],
        "faculty": "Dr. Brink"
    },
    {
        "title": "Improving DXA scan screening for female > 65 years",
        "leads": ["Saleem Aqsa"],
        "proponents": ["Affan Rashid", "Muhammad Ahmad", "Umair"],
        "faculty": null
    }
];

function findMatch(shortName, directoryList) {
    if (!shortName) return shortName;
    const clean = shortName.replace(/Dr\.?/i, '').replace(/\(incomplete proponents\)/i, '').trim();

    // Custom Overrides (Known Mappings)
    if (clean.toLowerCase().includes('naina')) return "Fnu Naina MD";
    if (clean.toLowerCase().includes('alhayek')) return "Bakr Alhayek MD";
    if (clean.toLowerCase().includes('malone')) return "Xiaowei Malone DO";
    // New overrides based on directory:
    // "Chaudhry" -> "Hamood Chaudhry MD" (Row 40 in CSV)
    if (clean.toLowerCase().includes('chaudhry')) return "Hamood Chaudhry MD";
    // "Komireddy" -> "NagaManeesh Komireddy MD" (Row 14)
    if (clean.toLowerCase().includes('komireddy')) return "NagaManeesh Komireddy MD";
    // "Kayamo" -> "Lidetu Kayamo MD" (Row 3)
    if (clean.toLowerCase().includes('kayamo')) return "Lidetu Kayamo MD";
    // "SouzaPeres" -> "JoaoVictor SouzaPeres DO" (Row 6)
    if (clean.toLowerCase().includes('souzaperes')) return "JoaoVictor SouzaPeres DO";

    // 1. Try Partial Match
    const matches = directoryList.filter(d => {
        return d.name.toLowerCase().includes(clean.toLowerCase());
    });

    if (matches.length === 1) {
        return matches[0].name; // Unique match!
    }

    // 2. Ambiguity Handling
    if (matches.length > 1) {
        // console.warn(`⚠️ Ambiguous: "${shortName}" -> Matches: [${matches.map(m => m.name).join(', ')}]`);
        return shortName;
    }

    return shortName;
}

async function updateProjects() {
    console.log('Step 1: Fetching full Directory...');

    // Fetch Directory with 100 limit to be parsed
    const { data: directoryData, error: dirError } = await supabase
        .from('directory')
        .select('name');

    if (dirError) {
        console.error("Directory fetch failed:", dirError.message);
        return;
    }

    console.log(`Fetched ${directoryData.length} directory records.`);

    console.log(`Step 2: Starting standardized update for ${projectsToUpdate.length} projects...`);

    let successCount = 0;

    for (const p of projectsToUpdate) {
        try {
            // Find project ID (Fuzzy Title Match)
            let { data: projects, error } = await supabase
                .from('projects')
                .select('id, title')
                .eq('title', p.title);

            if (!projects || projects.length === 0) {
                // Try substring match for long titles
                const simpleTitle = p.title.substring(0, 20);
                ({ data: projects, error } = await supabase
                    .from('projects')
                    .select('id, title')
                    .ilike('title', `%${simpleTitle}%`));
            }

            if (!projects || projects.length === 0) {
                console.warn(`Skipping "${p.title}" (Not Found)`);
                continue;
            }

            const projectId = projects[0].id;

            // Standardize Names, passing in dynamic directory
            const leadsStandardized = p.leads.map(lead => findMatch(lead, directoryData));
            const proponentsStandardized = p.proponents.map(prop => findMatch(prop, directoryData));

            // Update DB
            const { error: updateError } = await supabase
                .from('projects')
                .update({
                    lead_proponents: leadsStandardized,
                    proponents: proponentsStandardized
                })
                .eq('id', projectId);

            if (updateError) throw updateError;

            console.log(`✅ Updated "${projects[0].title}"`);
            // console.log(`   Leads: ${p.leads} -> ${leadsStandardized}`);
            successCount++;

        } catch (err) {
            console.error(`Error updating "${p.title}":`, err.message);
        }
    }

    console.log(`\nFinished. Success: ${successCount}`);
}

updateProjects();
