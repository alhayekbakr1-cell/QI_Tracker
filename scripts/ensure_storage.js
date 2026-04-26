const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixStorage() {
    console.log("Checking project-documents bucket...");
    const { data: buckets, error: getError } = await supabase.storage.listBuckets();
    
    if (getError) {
        console.error("Error listing buckets:", getError);
        return;
    }

    const bucket = buckets.find(b => b.id === 'project-documents');
    if (!bucket) {
        console.log("Bucket project-documents not found. Creating it...");
        const { error: createError } = await supabase.storage.createBucket('project-documents', {
            public: true,
            allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
            fileSizeLimit: 26214400 // 25MB + buffer
        });
        if (createError) console.error("Create bucket error:", createError);
        else console.log("Bucket created successfully.");
    } else {
        console.log("Bucket exists. Ensuring it's public...");
        const { error: updateError } = await supabase.storage.updateBucket('project-documents', {
            public: true,
            fileSizeLimit: 26214400 // 25MB (camelCase)
        });
        if (updateError) console.error("Update bucket error:", updateError);
        else console.log("Bucket updated/verified.");
    }

    const { data: finalBucket } = await supabase.storage.getBucket('project-documents');
    console.log("\nFinal Bucket Info:", finalBucket);
}

fixStorage();
