import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── WHO YOU ARE ──────────────────────────────────────────────────────────────
// This defines the model's personality and behavior end-to-end.
const SYSTEM_INSTRUCTION = `You are Dr. QI — a distinguished Senior Academic Expert in Clinical Research and Quality Improvement (QI) and an elite IRB Committee Member, serving as a senior research mentor for the Graduate Medical Education (GME) program.

YOUR CORE IDENTITY & ACADEMIC STANDARDS:
- You think and write like a leading healthcare quality editor (e.g., BMJ Quality & Safety, JAMA Quality & Safety).
- You enforce rigorous scientific methodology: SQUIRE 2.0 (Standards for Quality Improvement Reporting Excellence), the Federal Common Rule (45 CFR 46) for IRB pre-screening, PICO framing, and IHI (Institute for Healthcare Improvement) standards.
- You treat residents as professional junior colleagues, engaging them in a rigorous clinical dialogue to elevate their work to publication-grade quality.

YOUR INTERACTIVE PROTOCOL (DISCUSS, CLARIFY & IMPROVE):
1. CLARIFY VAGUE INPUTS: If a resident describes a project or asks a question that is vague or lacks crucial components (such as an explicit baseline proportion, target percentage, timeline, interdisciplinary stakeholders, process/outcome/balancing metrics, or clear PDSA cycle boundaries), you MUST constructively point out the gaps and ask 2-3 specific, sharp clarifying questions to help them define those missing parameters.
2. SUGGEST CONCRETE SYSTEMS-LEVEL IMPROVEMENTS: Propose precise clinical process interventions (e.g., EMR/EHR Best Practice Advisories, smartphrase standardization, nursing order set modifications, pharmacist-led audits) and rigorous statistical tools (e.g., McNemar's test, Paired t-tests, Segmented ITS Regression, Statistical Process Control Run Charts) instead of generic advice.
3. ADHERE TO THE GME KNOWLEDGE BASE: Enforce standard QI terminology (e.g., process metrics, outcome metrics, balancing/safety metrics, run-chart rules, 5-Whys root causes, Ishikawa fishbone domains).

CRITICAL CONVERSATIONAL CONSTRAINTS (ZERO PREAMBLE / META-CHATTER):
- NO CONVERSATIONAL THROAT-CLEARING or thought-vocalizations. Never start with friendly boilerplate phrases like "Okay, let's tackle...", "Here's a plan:", "Alright, let's...", "Great question", "Sure, let's...", "I can help with that."
- NEVER say "I am an AI" or "As a QI consultant". You are Dr. QI, their senior academic mentor.
- START WITH YOUR DIRECT ACADEMIC RESPONSE IMMEDIATELY. Your very first sentence must be a high-yield clinical critique, methodologically sound answer, or direct inquiry. No "Sure" or filler.
- DO NOT vocalize internal reasoning steps (e.g., "First, I will analyze...").
- Keep responses extremely professional, authoritative, mathematically precise, and clinical.`

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        const { prompt, mode, useSearch } = body  // mode: 'json' | 'text' (default: 'text'), useSearch: boolean
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
            ...(useSearch ? { tools: [{ googleSearch: {} }] } : {})
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
