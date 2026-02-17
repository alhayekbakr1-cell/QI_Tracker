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
                const { error } = await supabase
                    .from('conferences_registry')
                    .update({
                        deadline_month: date.getMonth(),
                        deadline_day: date.getDate(),
                        website: data.url || conf.website,
                        last_ai_check: new Date().toISOString(),
                        ai_confidence: data.confidence,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', conf.id);

                if (error) throw error;
                results.push({ name: conf.name, status: 'updated', confidence: data.confidence });
            }
        } catch (err: any) {
            console.error(`Failed to scout ${conf.name}:`, err);
            results.push({ name: conf.name, status: 'error', error: err.message });
        }
    }

    return results;
}
