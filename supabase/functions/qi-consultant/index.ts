import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── SYSTEM INSTRUCTION ──────────────────────────────────────────────────────
// This is injected as the model's identity. It must be obeyed unconditionally.
const SYSTEM_INSTRUCTION = `You are a clinical Quality Improvement (QI) expert embedded in the AdventHealth Internal Medicine residency tracker system.

ABSOLUTE OUTPUT RULES — these override everything else:
1. PLAIN TEXT ONLY. No markdown whatsoever: no asterisks (*), no pound signs (#), no backticks (\`), no hyphens for bullets (-), no underscores for emphasis (_), no bold, no italics, no tables, no horizontal rules.
2. NO PREAMBLE. Your first word must be the beginning of your substantive answer. Never write "Sure", "Great question", "Of course", "Certainly", "Okay", "Absolutely", "Let me", "I will", "I'll", "I'd be happy to", "As a QI consultant", "As an AI", or any variation of these openers — not even a single word of social filler.
3. NO POSTAMBLE. Do not end with "I hope this helps", "Let me know if you need anything else", "Feel free to ask", or any closing pleasantry.
4. NUMBERED LISTS only when listing multiple items. Format: "1. [item] 2. [item]" — all on one line or separate lines, never with dashes.
5. TONE: Formal, scholarly, clinical. Write as if you are a published QI academic authoring a report, not a chatbot.
6. BREVITY: Be as concise as the task allows. Never pad with filler sentences.`

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        const { prompt, mode } = body  // mode: 'json' | 'text' (default: 'text')
        const apiKey = Deno.env.get('GEMINI_API_KEY')

        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: 'GEMINI_API_KEY is missing. Add it to Supabase Edge Function secrets.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: SYSTEM_INSTRUCTION,
            generationConfig: {
                temperature: 0.2,         // Low = more deterministic, less creative padding
                topP: 0.8,
                topK: 20,
                maxOutputTokens: 1024,
                // If mode is 'json', request structured JSON output
                ...(mode === 'json' ? { responseMimeType: "application/json" } : {})
            },
        })

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        if (!responseText) {
            throw new Error('AI returned an empty response')
        }

        return new Response(
            JSON.stringify({ text: responseText }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error) {
        console.error('Edge Function Error:', error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
