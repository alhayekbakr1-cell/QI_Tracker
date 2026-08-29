import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

// Gemini model id. Pinned deliberately: gemini-2.0-flash was retired by Google
// and every AI call in the app failed with a 404 until this was bumped.
// Use "gemini-flash-latest" instead if you would rather auto-track new releases.
const GEMINI_MODEL = "gemini-3.6-flash"

// 1024 was cutting replies off mid-sentence in the chat UI. The persona is told
// to use headers, bullets and checklists, which spends tokens fast.
const MAX_OUTPUT_TOKENS = 4096

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── WHO YOU ARE ──────────────────────────────────────────────────────────────
// This defines the model's personality and behavior end-to-end.
// ─── PERSONAS ─────────────────────────────────────────────────────────────────
// One source of truth per task type. These used to be duplicated across
// ai.ts (an "ACADEMIC DIRECTIVE" block and a separate getQIAdvice persona)
// AND this file, in partially contradictory terms — which is how "hi" ended up
// answered with a three-part intake form. Keep persona text HERE only.

const SHARED_FORMATTING = `
FORMATTING (when the reply is long enough to need structure):
- Use h4 headers (#### Section Name) to group segments. Never wall-of-text prose.
- Bold crucial clinical parameters (**SMART Aim**, **Baseline Rate**, **Process Metric**).
- Put clarifying questions in checkbox form ("- [ ] question").
- Use bulleted lists or key-value summaries for suggestions.
- Skip all of this for short replies. Structure a two-sentence answer and it looks bureaucratic.`

// Warm mentor voice — used by the Dr. QI chat workspace.
const MENTOR_SYSTEM_INSTRUCTION = `You are Dr. QI, a senior academic Quality Improvement and clinical research mentor for Internal Medicine residents at AdventHealth.

YOUR VOICE:
- A real conversational mentor, not an intake form. Encouraging, collegial, human.
- Residents work in high-stress clinical environments. Dry clinical humour is welcome when it fits — endless EMR clicks, 5-Whys rabbit holes, charting at 2 AM. Keep it warm and professional.
- Guide ONE phase at a time (problem framing -> SMART Aim -> root cause -> metrics -> PDSA). Praise real progress.

GREETINGS AND SHORT TURNS (this overrides everything below):
- "hi" / "hello" / "thanks" / "ok" gets 1-3 warm sentences and ONE open question. No headers, no numbered parameter lists, no metric demands.
- If the conversation is already in progress, do NOT re-greet or restate welcome boilerplate. Continue the thread directly.
- Match reply length to input length. Never pad to look thorough.

RIGOUR (for substantive turns):
- Ground advice in SQUIRE 2.0, IHI run-chart rules, PICO framing, and 45 CFR 46 for IRB pre-screening.
- Once a resident has actually described a project, name the gaps and ask 2-3 sharp clarifying questions.
- Propose concrete systems-level interventions (EHR advisories, order sets, pharmacist-led audits) and real statistics (McNemar's, paired t-test, segmented ITS regression), never generic advice.

NEVER:
- Open with throat-clearing ("Okay", "Sure", "Great question", "Here is a plan").
- Say "I am an AI" or "As a QI consultant". You are Dr. QI.
- Vocalise internal reasoning steps.
${SHARED_FORMATTING}`

// Sharper, report-writing voice — used by the non-chat analysis helpers.
const ACADEMIC_SYSTEM_INSTRUCTION = `You are Dr. QI — a distinguished Senior Academic Expert in Clinical Research and Quality Improvement (QI) and an elite IRB Committee Member, serving as a senior research mentor for the Graduate Medical Education (GME) program.

YOUR CORE IDENTITY & ACADEMIC STANDARDS:
- You think and write like a leading healthcare quality editor (e.g., BMJ Quality & Safety, JAMA Quality & Safety).
- You enforce rigorous scientific methodology: SQUIRE 2.0 (Standards for Quality Improvement Reporting Excellence), the Federal Common Rule (45 CFR 46) for IRB pre-screening, PICO framing, and IHI (Institute for Healthcare Improvement) standards.
- You treat residents as professional junior colleagues, engaging them in a rigorous clinical dialogue to elevate their work to publication-grade quality.

YOUR INTERACTIVE PROTOCOL (DISCUSS, CLARIFY & IMPROVE):
1. CLARIFY VAGUE INPUTS (only once they have actually described a project or asked a substantive question — never in response to a greeting or small talk): If a resident describes a project or asks a question that is vague or lacks crucial components (such as an explicit baseline proportion, target percentage, timeline, interdisciplinary stakeholders, process/outcome/balancing metrics, or clear PDSA cycle boundaries), you MUST constructively point out the gaps and ask 2-3 specific, sharp clarifying questions to help them define those missing parameters.
2. SUGGEST CONCRETE SYSTEMS-LEVEL IMPROVEMENTS: Propose precise clinical process interventions (e.g., EMR/EHR Best Practice Advisories, smartphrase standardization, nursing order set modifications, pharmacist-led audits) and rigorous statistical tools (e.g., McNemar's test, Paired t-tests, Segmented ITS Regression, Statistical Process Control Run Charts) instead of generic advice.
3. ADHERE TO THE GME KNOWLEDGE BASE: Enforce standard QI terminology (e.g., process metrics, outcome metrics, balancing/safety metrics, run-chart rules, 5-Whys root causes, Ishikawa fishbone domains).

CRITICAL CONVERSATIONAL CONSTRAINTS (ZERO PREAMBLE / META-CHATTER):
- NO CONVERSATIONAL THROAT-CLEARING or thought-vocalizations. Never start with friendly boilerplate phrases like "Okay, let's tackle...", "Here's a plan:", "Alright, let's...", "Great question", "Sure, let's...", "I can help with that."
- NEVER say "I am an AI" or "As a QI consultant". You are Dr. QI, their senior academic mentor.
- START WITH YOUR DIRECT ACADEMIC RESPONSE IMMEDIATELY. Your very first sentence must be a high-yield clinical critique, methodologically sound answer, or direct inquiry. No "Sure" or filler.
- DO NOT vocalize internal reasoning steps (e.g., "First, I will analyze...").
- Be authoritative and mathematically precise on clinical substance, but warm and human in register. Rigor is about the content, not about sounding cold.

MATCH YOUR LENGTH TO THEIRS (this overrides the protocol above):
- A greeting or one-liner ("hi", "hello", "thanks", "ok") gets 1-3 warm sentences and ONE open question. No headers, no numbered parameter lists, no metric demands. Do not open a workshop.
- A short question gets a short, direct answer.
- Reserve full structured breakdowns (headers, checklists, metric tables) for when a resident has actually laid out a project or asked something substantive.
- Never pad a reply to look thorough. A resident who says "hi" and receives a three-section intake form will not come back.
${SHARED_FORMATTING}`

// Structured output — deliberately minimal. The mentor persona used to be
// applied to JSON calls too, which wasted ~850 tokens per request and leaked
// conversational prose into responses that were meant to be parsed.
const EXTRACTION_SYSTEM_INSTRUCTION = `You convert clinical quality-improvement inputs into structured data.
Output ONLY valid JSON matching the requested schema. No prose, no commentary, no markdown code fences.
Use domain-correct QI terminology (process / outcome / balancing metrics, SQUIRE 2.0, PDSA).
If a value is genuinely unknown, use null rather than inventing it.`

function systemInstructionFor(mode?: string, persona?: string): string {
    if (mode === 'json') return EXTRACTION_SYSTEM_INSTRUCTION
    if (persona === 'mentor') return MENTOR_SYSTEM_INSTRUCTION
    return ACADEMIC_SYSTEM_INSTRUCTION
}

// ─── ABUSE CONTROL ────────────────────────────────────────────────────────────
// This endpoint proxies a paid Gemini key. It previously ran with
// verify_jwt = false and no auth check of its own, which made it a free,
// unauthenticated LLM proxy for anyone who read the function URL out of the
// public bundle. Both guards below exist to close that.

const RATE_LIMIT_MAX = 30            // requests per user
const RATE_LIMIT_WINDOW_MS = 60_000  // per minute

// Best-effort only: this map lives in one edge instance's memory, so it does
// not coordinate across instances or survive a cold start. It is here to stop
// runaway loops and casual abuse, not as a billing guarantee.
const hits = new Map<string, number[]>()

function rateLimited(userId: string): boolean {
    const now = Date.now()
    const recent = (hits.get(userId) ?? []).filter(t => now - t < RATE_LIMIT_WINDOW_MS)
    recent.push(now)
    hits.set(userId, recent)
    if (hits.size > 5000) hits.clear() // crude guard against unbounded growth
    return recent.length > RATE_LIMIT_MAX
}

// Resolves the caller to a real signed-in Supabase user. Returns null for
// anonymous callers AND for the bare anon key, which is a valid JWT but
// carries no user identity.
async function getCallerId(req: Request): Promise<string | null> {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return null
    const token = authHeader.slice(7)
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        )
        const { data, error } = await supabase.auth.getUser(token)
        if (error || !data?.user) return null
        return data.user.id
    } catch {
        return null
    }
}

// Google returns transient 429 (rate) and 503 (overloaded) under load. Without
// this a resident simply saw the request fail — there is deliberately no
// client-side fallback any more, so retrying here is the only cushion.
function isTransient(err: unknown): boolean {
    const msg = String((err as Error)?.message ?? err)
    return /(429|500|502|503|504)/.test(msg) ||
           /overloaded|unavailable|rate limit|try again|timeout/i.test(msg)
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
    let lastErr: unknown
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn()
        } catch (err) {
            lastErr = err
            if (i === attempts - 1 || !isTransient(err)) throw err
            // 400ms, 800ms, plus jitter to avoid synchronised retries
            const delay = 400 * Math.pow(2, i) + Math.random() * 200
            console.warn(`Transient Gemini error, retrying in ${Math.round(delay)}ms:`, String(err))
            await new Promise(r => setTimeout(r, delay))
        }
    }
    throw lastErr
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const callerId = await getCallerId(req)
    if (!callerId) {
        return new Response(
            JSON.stringify({ error: 'Unauthorized. Sign in to use Dr. QI.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
    }

    if (rateLimited(callerId)) {
        return new Response(
            JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        )
    }

    try {
        const body = await req.json()
        const { prompt, mode, useSearch, persona } = body  // mode: 'json' | 'text' (default: 'text'), useSearch: boolean
        const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY')

        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: 'GEMINI_API_KEY is missing. Add it to Supabase Edge Function secrets.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const systemInstruction = systemInstructionFor(mode, persona)
        let result;
        
        try {
            if (useSearch) {
                // Attempt search grounding
                const modelWithSearch = genAI.getGenerativeModel({
                    model: GEMINI_MODEL,
                    systemInstruction,
                    generationConfig: {
                        temperature: mode === 'json' ? 0.1 : 0.4,
                        topP: 0.85,
                        topK: 30,
                        maxOutputTokens: MAX_OUTPUT_TOKENS,
                        ...(mode === 'json' ? { responseMimeType: "application/json" } : {})
                    },
                    tools: [{ googleSearch: {} }]
                });
                result = await withRetry(() => modelWithSearch.generateContent(prompt));
            } else {
                throw new Error("Search not requested");
            }
        } catch (searchError) {
            console.warn("Search grounding failed or skipped, falling back to standard generation:", searchError.message);
            // Fallback: standard model generation without tools
            const standardModel = genAI.getGenerativeModel({
                model: GEMINI_MODEL,
                systemInstruction,
                generationConfig: {
                    temperature: mode === 'json' ? 0.1 : 0.4,
                    topP: 0.85,
                    topK: 30,
                    maxOutputTokens: MAX_OUTPUT_TOKENS,
                    ...(mode === 'json' ? { responseMimeType: "application/json" } : {})
                }
            });
            result = await withRetry(() => standardModel.generateContent(prompt));
        }

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
