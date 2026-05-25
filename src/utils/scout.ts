import { createClient } from "./supabase/client";
import { fetchRegistry } from "@/constants/conferences";
import { getLiveConferenceDeadline } from "./ai";

export async function runRegistryScout() {
    const supabase = createClient();
    const conferences = await fetchRegistry();
    const results = [];

    for (const conf of conferences) {
        try {
            console.log(`Scouting ${conf.name}...`);
            const aiResponse = await getLiveConferenceDeadline(conf.name);
            // Clean JSON
            const cleaned = aiResponse.replace(/```json|```/g, '').trim();
            const data = JSON.parse(cleaned);

            if (data.deadline) {
                const date = new Date(data.deadline);
                const updatePayload: Record<string, any> = {
                    deadline_month: date.getMonth(),
                    deadline_day: date.getDate(),
                    website: data.url || conf.website,
                    last_ai_check: new Date().toISOString(),
                    ai_confidence: data.confidence,
                    updated_at: new Date().toISOString()
                };

                // Add enriched fields dynamically
                if (data.url) updatePayload.submission_url = data.url;
                if (data.abstractLimit) updatePayload.abstract_limit = data.abstractLimit;
                if (data.requiredSections) updatePayload.required_sections = data.requiredSections;
                if (data.posterDimensions) updatePayload.poster_dimensions = data.posterDimensions;
                if (data.gmeTips) updatePayload.gme_tips = data.gmeTips;

                const { error } = await supabase
                    .from('conferences_registry')
                    .update(updatePayload)
                    .eq('id', conf.id);

                if (error) {
                    console.warn(`Enriched update failed for ${conf.name}, attempting basic update fallback:`, error);
                    const basicPayload = {
                        deadline_month: date.getMonth(),
                        deadline_day: date.getDate(),
                        website: data.url || conf.website,
                        last_ai_check: new Date().toISOString(),
                        ai_confidence: data.confidence,
                        updated_at: new Date().toISOString()
                    };
                    const { error: basicError } = await supabase
                        .from('conferences_registry')
                        .update(basicPayload)
                        .eq('id', conf.id);
                    
                    if (basicError) throw basicError;
                }
                results.push({ name: conf.name, status: 'updated', confidence: data.confidence });
            }
        } catch (err: any) {
            console.error(`Failed to scout ${conf.name}:`, err);
            results.push({ name: conf.name, status: 'error', error: err.message });
        }
    }

    return results;
}
