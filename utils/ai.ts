import { createClient } from "./supabase/client";

// ─── OUTPUT CLEANERS ──────────────────────────────────────────────────────────

/** Strip any residual markdown the AI might still produce */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')      // ***bold italic***
    .replace(/\*\*(.*?)\*\*/g, '$1')           // **bold**
    .replace(/\*(.*?)\*/g, '$1')               // *italic*
    .replace(/^#{1,6}\s+/gm, '')              // ## headers
    .replace(/`{3}[\s\S]*?`{3}/g, '')         // ```code blocks```
    .replace(/`([^`]+)`/g, '$1')              // `inline code`
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [links](url)
    .replace(/^[-*+]\s+/gm, '')               // - bullet points
    .replace(/_{2,}/g, '')                     // __underline__
    .replace(/_{1}(.*?)_{1}/g, '$1')           // _italic_
    .replace(/\|.*?\|/g, '')                   // |table|cells|
    .replace(/^-{3,}$/gm, '')                 // --- horizontal rules
    .trim();
}

/**
 * Aggressively strip any conversational preamble the AI snuck in.
 * Runs multiple passes to catch multi-sentence openers.
 */
function stripPreamble(text: string): string {
  // Step 1: Remove leading filler sentences
  const fillerOpenings = [
    // Social openers
    /^(okay|ok|sure|great|certainly|of course|absolutely|noted|understood|alright|indeed)[,!.:]?\s*/gi,
    // "I will/am/can..." openers
    /^(i (will|am|can|understand|see|know|have|need|get|want|find|note|observe|recognize)|i'm (ready|happy|going|here|about|pleased|glad)|i've|i'd)[^.!?\n]*[.!?]\s*/gi,
    // "Let me..." / "Here is..."
    /^(let me|here (is|are|follows)|allow me|i'll now|i'll|as requested|as you asked|as a qi|as an ai|as a clinical|based on your request)[^.!?\n]*[.!?]\s*/gi,
    // "This response..." / "The following..."
    /^(this response|the following|below (is|are|you'll find))[^.!?\n]*[.!?]\s*/gi,
  ];

  let cleaned = text.trim();
  let changed = true;

  // Loop until no more filler is found at the start
  while (changed) {
    const before = cleaned;
    for (const pattern of fillerOpenings) {
      cleaned = cleaned.replace(pattern, '').trim();
    }
    changed = cleaned !== before;
  }

  // Step 2: If cleaned result is meaningful, use it. Otherwise return original.
  return cleaned.length > 15 ? cleaned : text.trim();
}

/** Strip closing pleasantries */
function stripPostamble(text: string): string {
  const closingPatterns = [
    /\s*(i hope (this|that) helps?[.!]?|feel free to ask[.!]?|let me know if you (need|have)[^.!]*[.!]?|please (let me know|don't hesitate)[^.!]*[.!]?|good luck[.!]?)\s*$/gi,
  ];
  let cleaned = text.trim();
  for (const pattern of closingPatterns) {
    cleaned = cleaned.replace(pattern, '').trim();
  }
  return cleaned;
}

/** Full clean pipeline applied to all AI responses */
function clean(text: string): string {
  return stripPostamble(stripPreamble(stripMarkdown(text)));
}

// ─── CORE API CALL ────────────────────────────────────────────────────────────

async function invokeAI(prompt: string, mode: 'text' | 'json' = 'text'): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke('qi-consultant', {
    body: { prompt, mode }
  });
  if (error) throw error;
  if (!data?.text) throw new Error('No response from AI');
  return data.text;
}

/** Standard text response — runs full clean pipeline */
export async function askAI(prompt: string): Promise<string> {
  const raw = await invokeAI(prompt, 'text');
  return clean(raw);
}

/** JSON response — parses structured output without cleaning */
async function askAIJson<T>(prompt: string): Promise<T> {
  const raw = await invokeAI(prompt, 'json');
  try {
    // Strip code fences if the model wraps JSON in ```json ... ```
    const jsonStr = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(jsonStr) as T;
  } catch {
    throw new Error(`AI returned invalid JSON: ${raw.slice(0, 200)}`);
  }
}

// ─── AI FUNCTIONS ─────────────────────────────────────────────────────────────

export async function improveWriting(text: string, fieldContext: string): Promise<string> {
  const prompt = `You are a clinical QI academic writing editor.
Improve the following text from the "${fieldContext}" field of a QI project form.
Make it professional, precise, and suitable for institutional documentation.
Preserve all factual content — do not add information not already present.
Output only the improved text with no explanation.

Original:
${text}`;
  return askAI(prompt);
}

export async function draftSummary(points: string): Promise<string> {
  const prompt = `Convert the following bullet points into a professional, scholarly paragraph for a QI project's "Updates and Barriers" section.
Use formal, objective, academic tone suitable for an institutional tracker.
Output only the paragraph.

Points:
${points}`;
  return askAI(prompt);
}

export async function analyzePDSA(projectData: any, metrics: any[]): Promise<string> {
  const metricsText = metrics.length > 0
    ? metrics.map(m => `${m.label}: ${m.value} (${m.month})`).join(', ')
    : 'No metrics recorded yet.';

  const prompt = `Analyze the following QI project and provide:
1. A 2-sentence assessment of current progress based on the metrics.
2. One specific, actionable recommendation for the next PDSA cycle.

Project: ${projectData.title}
Status: ${projectData.status}
Category: ${projectData.category || 'General'}
Primary Outcome: ${projectData.primary_outcome || 'Not specified'}
Metrics: ${metricsText}
Recent Updates: ${projectData.updates_and_barriers || 'None'}`;
  return askAI(prompt);
}

export async function generateSMARTAim(projectTitle: string, currentAim: string): Promise<string> {
  const prompt = `Convert the following into a formal SMART Aim statement (Specific, Measurable, Achievable, Relevant, Time-bound).
Use one paragraph. No labels or prefixes.

Project: ${projectTitle}
Initial Aim: ${currentAim}`;
  return askAI(prompt);
}

export async function suggestMetrics(projectTitle: string): Promise<string> {
  const prompt = `For a QI project titled "${projectTitle}", provide exactly three metrics:
1. Process Metric: what the team will do.
2. Outcome Metric: how patients benefit.
3. Balancing Metric: what unintended effect to watch.
Be specific and concise.`;
  return askAI(prompt);
}

export async function getQIAdvice(question: string, context?: string, handbookContent?: string): Promise<string> {
  const prompt = `You are a QI Academic Consultant at AdventHealth.
${handbookContent ? `Handbook context (apply these rules and terminology):\n${handbookContent}\n` : ''}
${context ? `Project context: ${context}\n` : ''}
Resident question: ${question}

Respond concisely and academically. Cite specific handbook steps if provided.`;
  return askAI(prompt);
}

export async function generateExecutiveReport(projectsSummary: string): Promise<string> {
  const prompt = `You are the QI Chief Consultant preparing an executive report for hospital leadership.
Analyze the following QI project data and structure your report with exactly three sections labeled:
[Institutional Progress], [Barrier Analysis], [Strategic Recommendation]

For Barrier Analysis, distinguish between Systemic/Institutional barriers (IRB, IT access, staffing) and Project-Specific barriers.
Identify the top 3 institutional blockers and propose one institutional-level intervention.

Data:
${projectsSummary}`;
  return askAI(prompt);
}

/** Returns a structured { score: number, feedback: string } object */
export async function auditProjectQuality(projectData: any): Promise<{ score: number; feedback: string }> {
  const prompt = `Audit this QI project for academic completeness. Return a JSON object with exactly two fields:
- "score": integer 0-100 representing completeness
- "feedback": one or two sentences describing what is missing or should be improved

Project:
Title: ${projectData.title}
Aim: ${projectData.primary_outcome || 'Not provided'}
Updates: ${projectData.updates_and_barriers || 'Not provided'}
Category: ${projectData.category || 'Not specified'}
Metrics: ${projectData.has_metrics ? 'Present' : 'Not recorded'}`;

  try {
    return await askAIJson<{ score: number; feedback: string }>(prompt);
  } catch {
    // Fallback: try text mode and parse manually
    const raw = await askAI(prompt);
    const scoreMatch = raw.match(/(\d{1,3})/);
    const score = scoreMatch ? Math.min(100, parseInt(scoreMatch[1])) : 70;
    // Remove score mention from feedback text
    const feedback = raw.replace(/\d{1,3}[\/\s]*(?:out of\s*)?100/gi, '').trim();
    return { score, feedback };
  }
}

export async function checkDuplication(newTitle: string, existingSummaries: string): Promise<string> {
  const prompt = `A resident wants to start a new QI project titled: "${newTitle}"

Existing projects:
${existingSummaries}

In 2-3 sentences: does this overlap with an existing project? If yes, suggest how to collaborate or differentiate. If no, state "This project appears unique."`;
  return askAI(prompt);
}

export async function draftProtocol(projectData: any): Promise<string> {
  const prompt = `Draft a QI project protocol using SQUIRE 2.0 guidelines with these sections:
Background, Aim Statement, Methods, Outcome Measures, PDSA Plan.
Write in formal academic prose. No markdown formatting.

Project Title: ${projectData.title}
Status: ${projectData.status}
Category: ${projectData.category || 'General'}
Primary Outcome: ${projectData.primary_outcome || 'Not specified'}
Updates and Barriers: ${projectData.updates_and_barriers || 'None provided'}`;
  return askAI(prompt);
}

export async function getSuggestedTags(title: string, category: string): Promise<string> {
  const prompt = `For a QI project titled "${title}" in the category "${category}", output exactly 4-5 relevant medical or QI keywords as hashtags.
Format: #Keyword1, #Keyword2, #Keyword3, #Keyword4
No other text.`;
  return askAI(prompt);
}

export async function getProtocolSectionAdvice(section: string, question: string): Promise<string> {
  const prompt = `A resident is writing the "${section}" section of a QI protocol and asks: ${question}

Provide concise, academic guidance (2-3 sentences) specific to this section.`;
  return askAI(prompt);
}