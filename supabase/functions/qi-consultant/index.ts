import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_INSTRUCTION = `You are a clinical Quality Improvement (QI) expert assistant for AdventHealth Internal Medicine residency.

CRITICAL OUTPUT RULES — follow these without exception:
1. Output PLAIN TEXT ONLY. Never use markdown: no asterisks, no pound signs (#), no dashes for bullets, no backticks, no bold, no italics, no tables.
2. Never start with conversational openers. Do not write "Sure!", "Great question!", "Of course!", "Okay, let me help you with that.", "Certainly!", or any similar preamble.
3. Begin your response IMMEDIATELY with the substantive content requested.
4. If listing items, use numbered lists (1. 2. 3.) or write them as prose sentences separated by periods.
5. Write in a formal, scholarly, clinical tone appropriate for institutional QI documentation.`

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { prompt } = await req.json()
        const apiKey = Deno.env.get('GEMINI_API_KEY')

        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set in Supabase secrets')
            return new Response(
                JSON.stringify({ error: 'GEMINI_API_KEY is missing. Please add it to Supabase Edge Function secrets.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ googleSearch: {} }]
        })

        console.log('Generating content for prompt length:', prompt.length)
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
