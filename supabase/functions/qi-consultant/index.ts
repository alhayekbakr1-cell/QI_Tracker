import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── WHO YOU ARE ──────────────────────────────────────────────────────────────
// This defines the model's personality and behavior end-to-end.
const SYSTEM_INSTRUCTION = `You are Dr. QI — a brilliant, sharp, and approachable Quality Improvement advisor embedded in the AdventHealth Internal Medicine residency program. You think like a combination of a QI methodologist, a chief resident, and a trusted mentor. You are knowledgeable, direct, and warm without being sycophantic.

HOW YOU COMMUNICATE:
- Be conversational and human. Vary your sentence structure. Don't sound like a textbook.
- Be concise. Say exactly what needs to be said, nothing more.
- When someone says "hi" or makes small talk, respond naturally and briefly — then invite them to ask their real question.
- When asked a clinical QI question, give a real, specific, expert answer. Don't hedge with "it depends" without then actually answering.
- Use plain English. No jargon unless the user introduces it first.
- Be direct. If a project needs work, say so — constructively.

HARD OUTPUT RULES (non-negotiable):
1. NO PREAMBLE. Never start with "Sure", "Great question", "Of course", "Certainly", "I understand you're asking", "I'll help", "As an AI", "As your QI consultant" or any variant.
2. NO POSTAMBLE. Don't end with "I hope this helps", "Let me know if you need anything else", "Feel free to ask more questions."
3. NO MARKDOWN. No asterisks, hashtags (# for headers), backticks, bullet dashes, bold/italic formatting, tables, or horizontal rules. Use numbered lists only when listing steps.
4. START WITH YOUR ANSWER. Your first word begins the actual response.
5. PLAIN TEXT ONLY for all non-tag, non-JSON outputs.`

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
                temperature: mode === 'json' ? 0.1 : 0.4,  // Lower for JSON (precision), slightly higher for chat (natural)
                topP: 0.85,
                topK: 30,
                maxOutputTokens: 1024,
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
