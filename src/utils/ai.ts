import { createClient } from "./supabase/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient();

export async function askAI(prompt: string, options?: { mode?: 'json' | 'text'; useSearch?: boolean; isChat?: boolean }) {
  const isJsonRequest = options?.mode === 'json' || 
    /output\s+ONLY\s+a\s+valid,?\s+raw\s+JSON/i.test(prompt) || 
    /output\s+ONLY\s+the\s+JSON/i.test(prompt) ||
    /schema:/i.test(prompt);

  const requestMode = isJsonRequest ? 'json' : 'text';

  // If it's a standard text/dialogue prompt, wrap it with our elite senior academic consultant instructions.
  let finalPrompt = prompt;
  if (!isJsonRequest && !options?.isChat) {
    finalPrompt = `[ACADEMIC DIRECTIVE: You are Dr. QI, the Senior Academic Expert in Clinical Research and GME Quality Improvement.
    
    1. ZERO PREAMBLE: Start your answer immediately. Do not say "Okay", "Sure", "Let's begin", "Here is a plan", "Great question", or any conversational throat-clearing.
    2. SHARP ACADEMIC TONE: Speak directly to the resident as a high-level research peer. Use authoritative clinical terminology (SQUIRE 2.0, IHI, PICO).
    3. ACTIVE METHODOLOGY PROBING: If the resident's input or question is vague or lacks specific metrics (e.g., baseline rates, target change %, timeline, safety/balancing measures), you MUST constructively point out these deficiencies and ask 2-3 specific, direct questions to clarify and perfect their project.
    4. SUGGEST CONCRETE SYSTEMS-LEVEL PATHWAYS: Recommend specific electronic medical record (EMR/EHR) triggers, interdisciplinary audits, or robust statistical tools (McNemar's, Paired t-test, Segmented ITS Regression) to optimize their implementation strategy.
    5. VISUALLY ATTRACTIVE & SCANNABLE FORMATTING: Long, blocky prose paragraphs are strictly prohibited. Break up your analysis, critiques, and questions into visually stunning, scannable Markdown layouts:
       - Use clean h4 headers (#### Section Name) to group advice segments.
       - Highlight crucial clinical parameters in bold text (e.g. **SMART Aim**, **Baseline Rate**, **Process Metric**).
       - Format all interactive clarifying queries as clean checkboxes (e.g. "- [ ] Checkbox Query").
       - Present suggestions in neat bulleted lists or structured key-value summaries.
     ]
    
    User Query: ${prompt}`;
  }

  let responseText = "";

  try {
    const { data, error } = await supabase.functions.invoke('qi-consultant', {
      body: { 
        prompt: finalPrompt,
        mode: requestMode,
        useSearch: options?.useSearch
      }
    });

    if (error) throw error;
    responseText = data.text || "";
  } catch (invokeError) {
    console.warn("Supabase Edge Function invoke failed, executing client-side browser Gemini fallback:", invokeError);
    
    const clientApiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY || 
                         process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
                         "";
                         
    if (clientApiKey) {
      try {
        const genAI = new GoogleGenerativeAI(clientApiKey);
        // Fall back to standard model generation directly in browser
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          generationConfig: {
            temperature: requestMode === 'json' ? 0.1 : 0.4,
            ...(requestMode === 'json' ? { responseMimeType: "application/json" } : {})
          }
        });
        const result = await model.generateContent(finalPrompt);
        responseText = result.response.text();
      } catch (clientError) {
        console.error("Client-side fallback execution failed:", clientError);
        throw invokeError; // rethrow original if fallback also fails
      }
    } else {
      throw invokeError;
    }
  }

  // Client-side Bulletproof post-processing: strip all conversational preambles/throat-clearing
  if (!isJsonRequest) {
    const preamblesToStrip = [
      /^(okay|ok|alright|sure|great|absolutely|of course|certainly),?\s+(let's|we can|tackle|start|look at|begin|outline|plan)\b[^\n]*/i,
      /^here is a (plan|summary|breakdown|guide):?\s*/i,
      /^great question\.?\s*/i,
      /^certainly,?\s*/i,
      /^sure,?\s*/i,
      /^as an ai,?\s*/i,
      /^as your qi consultant,?\s*/i
    ];
    
    let cleaned = true;
    while (cleaned) {
      cleaned = false;
      for (const regex of preamblesToStrip) {
        if (regex.test(responseText)) {
          responseText = responseText.replace(regex, "").trim();
          cleaned = true;
        }
      }
    }
    
    // Capitalize the first letter of the cleaned output if needed
    if (responseText.length > 0) {
      responseText = responseText.charAt(0).toUpperCase() + responseText.slice(1);
    }
  }

  return responseText;
}

export async function draftSummary(points: string) {
  const prompt = `
    You are a Quality Improvement (QI) Academic Consultant. 
    Convert the following bullet points into a professional, scholarly paragraph for a project's "Updates and Barriers" section.
    Maintain a formal, objective, and academic tone suitable for an institutional tracker.
    
    Points:
    ${points}
    
    Output only the paragraph.
  `;

  return askAI(prompt);
}

export async function analyzePDSA(projectData: any, metrics: any[]) {
  const prompt = `
    You are a Quality Improvement (QI) Academic Consultant.
    Based on the following project data and metrics, provide a concise (3-4 sentence) analysis of the current state and suggest the specific focus for the NEXT PDSA cycle.
    
    Project Title: ${projectData.title}
    Current Status: ${projectData.status}
    Category: ${projectData.category}
    
    Metrics:
    ${JSON.stringify(metrics, null, 2)}
    
    Provide your analysis with an academic tone.
    
    CRITICAL: After your paragraph analysis, you MUST suggest 2 highly specific, actionable next-step tasks for their next PDSA cycle.
    Format your entire response EXACTLY as follows (do not include markdown block quotes or extra text outside these tags):
    
    [ANALYSIS]
    Your concise 3-4 sentence academic analysis paragraph here.
    [/ANALYSIS]
    
    [RECOMMENDATION_CARDS]
    [
      {
        "title": "Short, actionable title of suggested task 1",
        "description": "Specific description of task 1 and why it is recommended."
      },
      {
        "title": "Short, actionable title of suggested task 2",
        "description": "Specific description of task 2 and why it is recommended."
      }
    ]
    [/RECOMMENDATION_CARDS]
  `;

  return askAI(prompt);
}

export async function generateSMARTAim(projectTitle: string, currentAim: string) {
  const prompt = `
    You are a Quality Improvement (QI) Academic Consultant.
    Convert the following project title and initial aim statement into a formal SMART Aim statement.
    SMART = Specific, Measurable, Achievable, Relevant, and Time-bound.
    
    Project Title: ${projectTitle}
    Initial Aim: ${currentAim}
    
    Output ONLY the SMART Aim paragraph.
  `;
  return askAI(prompt);
}

export async function suggestMetrics(projectTitle: string) {
  const prompt = `
    You are a Quality Improvement (QI) Academic Consultant.
    For a project titled "${projectTitle}", suggest:
    1. A Process Metric (What are we doing?)
    2. An Outcome Metric (How does it help patients?)
    3. A Balancing Metric (What else might change?)
    
    Provide a professional, concise list.
  `;
  return askAI(prompt);
}

export async function getQIAdvice(
  question: string,
  context?: string,
  handbookContent?: string,
  history?: { role: 'user' | 'ai'; content: string }[]
) {
  const defaultHandbook = `
  ADVENTHEALTH GME QI & SCHOLARLY ACTIVITY ACADEMIC GUIDELINES:
  
  1. GRADUATION & MILESTONE REQUIREMENTS:
     - Residents must fulfill three distinct scholarly milestones to satisfy GME Board requirements and be cleared as "Board Ready":
       a. QI Protocol Approved: Complete a formal project protocol mapped with PICOT criteria.
       b. 2+ PDSA Cycles Completed: Iterative testing of process changes (a single cycle is insufficient for rigorous quality tracking).
       c. Institutional Presentation: Present findings at a regional/national conference or our annual Institutional GME Research Day.
     
  2. METRICS & DATA TRACKING DEFINITIONS:
     - Process Metrics: Measure compliance with the new standard workflow checklist (e.g., "% of eligible patients with EMR best practice advisory triggered"). Target: Process compliance must be audited frequently.
     - Outcome Metrics: Direct clinical impact or patient benefit (e.g., "absolute reduction in telemetry hours per patient", "decrease in safety-event rate").
     - Balancing Metrics: Safety checks tracking unintended consequences, workload shifts, or systems-level impacts (e.g., "nurse cognitive load score", "median emergency room length of stay", "total hospital cost changes").
     - Run Charts (IHI Standards): Requires a minimum of 10-12 data points to establish a stable run chart. Apply the four standard IHI Run Chart rules for non-random change detection:
       - Rule 1 (Shift): 6 or more consecutive points all above or all below the median.
       - Rule 2 (Trend): 5 or more consecutive points continuously increasing or decreasing.
       - Rule 3 (Runs): Too many or too few crossings of the median.
       - Rule 4 (Astronomical Point): An obvious, singular, extreme outlier.
  
  3. ROOT CAUSE ANALYSIS (RCA) METHODOLOGY:
     - Ishikawa (Fishbone) Domains: Every project must evaluate five distinct root-cause dimensions: People (staffing, knowledge), Process (workflows, standard protocols), Equipment (EHR configurations, order sets), Environment (culture, layout), and Materials (templates, educational handouts).
     - 5-Whys Analysis: A sequence of logical queries leading to the actionable organizational root cause.
     - 4. IRB DETERMINATION & COMPLIANCE:
     - Quality Improvement projects are classified under 45 CFR 46.102(l) as systemic, data-guided activities designed for local clinical improvement, and are typically determined as "Exempt/Non-Research". However, any activity seeking generalizable knowledge through randomized trials is classified as Human Subjects Research (HSR) and requires full IRB review.
  `;

  // Format the conversation history to feed to the LLM
  const historyText = history && history.length > 0
    ? history.map(msg => `${msg.role === 'user' ? 'Resident' : 'Dr. QI'}: ${msg.content}`).join('\n\n')
    : '';

  const prompt = `You are Dr. QI, a senior, friendly academic research and Quality Improvement mentor for residents at AdventHealth.
Your goal is to guide the resident step-by-step through their scholarly projects in an interactive, encouraging, and highly educational manner.

RULES:
1. FRIENDLY & INTERACTIVE: Speak like a real conversational mentor. If the resident says hello (e.g. "hi", "hello", "hey"), greet them warmly and ask how their QI project brainstorming is going. Do not demand clinical metrics or throw lists of questions at them for simple greetings!
2. STEP-BY-STEP GUIDANCE: Guide them through one phase at a time (e.g., brainstorming the problem, shaping a SMART Aim, mapping root causes, selecting Process/Outcome/Balancing metrics, and designing PDSA cycles). Praise their progress!
3. HIGHLY VISUAL & SCANNABLE: Break up your replies into readable formatting:
   - Use clean h4 headers (#### Section Name) to group advice segments.
   - Highlight clinical parameters in bold (**SMART Aim**, **Process Metric**).
   - Format interactive queries as clean checklists (e.g., "- [ ] Can you describe the clinical problem?") or bulleted lists.
4. GME KNOWLEDGE GROUNDING: Ground all advice in the official guidelines:
${handbookContent || defaultHandbook}

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n\n` : ''}
Current Resident Message: "${question}"
${context ? `Project Context: ${context}` : ''}

Respond conversationally as Dr. QI:`;

  return askAI(prompt, { isChat: true });
}

export async function generateExecutiveReport(projectsSummary: string) {
  const prompt = `
    You are a Quality Improvement (QI) Chief Consultant.
    Analyze the following summary of current QI projects and generate a high-level executive report for the hospital leadership.
    
    CRITICAL: 
    1. Categorize barriers into "Systemic/Institutional" (e.g., IRB backlog, IT access) vs "Project-Specific".
    2. Identify the Top 3 institutional blockers across the residency program.
    3. Suggest one institutional-level intervention to accelerate progress.
    
    Summary Data:
    ${projectsSummary}
    
    Structure the output with clear headings: [Institutional Progress], [Barrier Analysis Heatmap], [Strategic Recommendation].
    Keep the report professional, academic, and action-oriented.
  `;
  return askAI(prompt);
}

export async function auditProjectQuality(projectData: any) {
  const prompt = `
    You are a Quality Improvement (QI) Quality Auditor.
    Audit the completeness and academic quality of this project entry:
    
    Title: ${projectData.title}
    Aim: ${projectData.primary_outcome}
    Updates: ${projectData.updates_barriers}
    
    Provide a brief "Quality Score" (0-100) and 1-2 sentences of feedback on what is missing or can be improved (e.g., missing metrics, vague aim).
  `;
  return askAI(prompt);
}

export async function checkDuplication(newTitle: string, existingSummaries: string) {
  const prompt = `
    You are a Quality Improvement (QI) Project Auditor.
    A resident is trying to start a new project titled: "${newTitle}".
    
    Here is a list of existing or past projects:
    ${existingSummaries}
    
    Determine if this new project is a duplicate or significantly overlaps with an existing one.
    If it overlaps, suggest how the resident could collaborate or build upon the previous work instead.
    If it's unique, simply say "This project appears unique."
    
    Be concise (2-3 sentences).
  `;
  return askAI(prompt);
}

export async function getSuggestedTags(title: string, category: string) {
  const prompt = `
    You are a Quality Improvement (QI) Project Metadata Specialist.
    For a project titled "${title}" in the category "${category}", suggest 4-5 relevant medical or QI keywords/hashtags.
    
    Output ONLY the comma-separated keywords (e.g. #Sepsis, #Outpatient, #Handwashing).
  `;
  return askAI(prompt);
}

export async function getProtocolSectionAdvice(section: string, question: string) {
  const prompt = `
    You are a Quality Improvement (QI) Academic Consultant at AdventHealth.
    A resident is currently filling out the "${section}" section of their QI Protocol.
    
    Resident's Question: "${question}"
    
    Provide a professional, academic, and encouraging answer that helps them fill this specific section correctly according to QI best practices (e.g., SQUIRE guidelines, PDSA methodology).
    Be concise but high-value.
  `;
  return askAI(prompt);
}

export async function getLiveConferenceDeadline(conferenceName: string) {
  const currentYear = new Date().getFullYear();
  const currentDateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const prompt = `
    You are a Senior GME Academic Quality Improvement Scout. 
    The current local date is ${currentDateStr}.
    
    Using Google Search grounding, look up the absolute most recent and official abstract submission requirements, dates, and writing guidelines for the next upcoming "${conferenceName}" conference (focusing strictly on the upcoming cycle in ${currentYear} or ${currentYear + 1}).
    
    CRITICAL LOOKUP DIRECTIONS:
    1. Search for the next official abstract submission deadline and year (e.g. for SHM, ACP, CHEST, SGIM, etc.). Focus strictly on the upcoming cycle in ${currentYear} or ${currentYear + 1}. Do NOT return historical dates from ${currentYear - 1} or earlier (like 2024 or 2025).
    2. Extract the exact word or character count limit for abstract submissions.
    3. Identify the exact required structural headings (e.g. "INTRODUCTION, METHODS, RESULTS, DISCUSSION" vs "BACKGROUND, METHODS, RESULTS, CONCLUSIONS").
    4. Extract the official poster physical dimensions and orientation (e.g. "4' x 6' Horizontal", "4' x 4' Square").
    5. Summarize a 1-sentence "GME success strategy" for resident physicians submitting QI work to this specific conference.
    6. Identify the exact direct URL for abstract submissions or author guidelines.
    
    You MUST output ONLY a valid, raw JSON object matching this schema:
    {
      "deadline": "YYYY-MM-DD",
      "displayDate": "Readable Date (e.g., November 24, 2026)",
      "url": "Direct Abstract submission/guidelines URL link",
      "abstractLimit": "Word/char limit (e.g. '300 words' or '2,500 characters')",
      "requiredSections": "Comma-separated required headings (e.g. 'INTRODUCTION, METHODS, RESULTS, CONCLUSIONS')",
      "posterDimensions": "Poster physical size (e.g. '4\\\' x 4\\\' (48\" x 48\") Square' or '4\\\' x 6\\\' (48\" x 72\") Horizontal')",
      "gmeTips": "High-value, actionable clinical advice for resident quality improvement submissions",
      "confidence": "High/Medium/Low",
      "notes": "Brief explanation of the search findings and verified year"
    }
  `;
  return askAI(prompt, { mode: 'json', useSearch: true });
}

export async function generateAbstract(project: any, format: 'standard' | 'acp' | 'shm' | 'ihi' | 'bmj' = 'standard') {
  let formatInstructions = '';
  
  if (format === 'standard') {
    formatInstructions = `
      Format: Standard SQUIRE 2.0 format (under 300 words).
      Structure the abstract exactly with the following capitalized headings:
      BACKGROUND: Describe the local healthcare gap, clinical justification, and precise baseline median.
      METHODS: Describe the PICOT elements, interdisciplinary workflows modified, and specific process/outcome/balancing metrics tracked across iterative PDSA cycles.
      RESULTS: Report the absolute and relative delta changes in metrics (e.g. from X% to Y%, ARR/relative change), patient volume reached, and run chart statistical indicators.
      CONCLUSIONS & SUSTAINABILITY: Detail the long-term sustainability structures, barriers overcome, and generalizability of the interventions.
    `;
  } else if (format === 'acp') {
    formatInstructions = `
      Format: American College of Physicians (ACP) Poster Style (under 250 words).
      Structure the abstract exactly with the following capitalized headings:
      INTRODUCTION: Describe local quality gaps, patient care implications, and the project's SMART aim.
      METHODS: Detail targeted process modifications, interdisciplinary team members, and the quantitative measurement strategy.
      RESULTS: Show robust pre-post improvements (state absolute and relative improvements, total patients reached, and clinical/cost deltas).
      DISCUSSION: Highlight the feasibility, institutional limitations, and broader generalizability to regional internal medicine practices.
    `;
  } else if (format === 'shm') {
    formatInstructions = `
      Format: Society of Hospital Medicine (SHM) Style (under 300 words).
      Structure the abstract exactly with the following capitalized headings:
      INTRODUCTION: Highlight the specific inpatient safety gap or hospital system workflow inefficiency.
      METHODS: Detail hospital medicine workflow integrations, interdisciplinary collaborations (e.g., pharmacy, nursing, care management), and process/outcome/balancing measures tracked during PDSA cycles.
      RESULTS: State clear, quantitative inpatient outcomes (e.g., absolute reduction in length of stay, relative compliance increases, financial cost savings, and patients impacted).
      CONCLUSIONS: Outline the direct implications for hospitalists and specific sustainability mechanisms to prevent regression.
    `;
  } else if (format === 'ihi') {
    formatInstructions = `
      Format: Institute for Healthcare Improvement (IHI) Style (under 250 words).
      Structure the abstract exactly with the following capitalized headings:
      CONTEXT: Systems-level clinical setting and local baseline problem.
      AIM: A formal SMART aim statement (who, what, how much, and by when).
      INTERVENTION: The specific human-factors-focused process modifications tested.
      MEASURES: Family of measures including Process, Outcome, and Balancing metrics.
      RESULTS: Quantitative run chart performance, detailing trends, shifts of 6+ points, and absolute delta improvements.
      LESSONS LEARNED: Key insights, failures adapted, barrier mitigations, and the sustainment/spread plan.
    `;
  } else if (format === 'bmj') {
    formatInstructions = `
      Format: BMJ Quality & Safety Journal Style (under 350 words).
      Structure the abstract exactly with the following capitalized headings:
      PROBLEM: Local quality deficiency, baseline performance, and specific setting.
      BACKGROUND: Scientific literature justification and rationale for the chosen intervention.
      MEASUREMENT: Quantitative metric definitions and statistical process control (SPC) data tracking method.
      DESIGN: Description of successive PDSA cycles and structural adaptations.
      STRATEGY: Details of team engagement, workflow embedding, and overcoming resistance to change.
      RESULTS: Absolute and relative delta data points, patient volumes, run chart statistics, and balancing metrics.
      LESSONS LEARNED: Ethical observations, cost/workload impacts, and failures adapted.
      CONCLUSION: Generalizability, limitations, and future steps for clinical sustainability.
    `;
  }

  const prompt = `
    You are an expert Quality Improvement (QI) Academic Consultant. 
    Write a formal, highly rigorous, and publication-ready clinical abstract for the following QI project.
    
    Project Title: ${project.title}
    Category: ${project.category}
    Current Status: ${project.status}
    Primary Outcome/Aim: ${project.primary_outcome}
    PDSA Cycles: ${project.pdsa_cycle}
    Updates/Barriers/Sustainment: ${project.updates_and_barriers}
    Patients Impacted: ${project.total_patients_impacted || 0}
    Cost Savings: $${project.estimated_cost_savings || 0}
    
    CRITICAL SCIENTIFIC & FORMATTING INSTRUCTIONS:
    1. Follow the SQUIRE 2.0 framework rigidly.
    2. Incorporate explicit PICO elements.
    3. Ensure quantitative metrics are clear: specify absolute changes (e.g., from X% to Y%, a Z% absolute increase) and relative percentages.
    4. Highlight balancing/safety metrics, estimated clinical or financial cost savings, and long-term sustainability plans.
    5. Avoid any generic placeholders. Use the actual project facts. If details are missing, extrapolate scientifically reasonable clinical details that match the setting.
    
    ${formatInstructions}
    
    Keep the tone formal, highly objective, concise, and suitable for a leading medical journal or national GME conference. Output ONLY the abstract text.
  `;
  return askAI(prompt);
}

export async function improveWriting(text: string, context?: string) {
  const prompt = `
    You are a Quality Improvement (QI) Academic Consultant.
    Improve the following text to make it more professional, scholarly, and concise for a medical quality improvement project tracker.
    ${context ? `The specific context for this text is: ${context}` : ''}
    Maintain the original meaning but enhance the academic tone.
    
    Text: "${text}"
    
    Output ONLY the improved text.
  `;
  return askAI(prompt);
}

export async function draftProtocol(pico: { p: string; i: string; c: string; o: string }) {
  const prompt = `
    You are a Quality Improvement (QI) Academic Consultant.
    Based on the following PICO components, draft a formal QI Project Protocol (approx 300 words).
    
    Population (P): ${pico.p}
    Intervention (I): ${pico.i}
    Comparison (C): ${pico.c}
    Outcome (O): ${pico.o}
    
    The protocol should include sections for Background, SMART Aim, Methods (PDSA approach), and Planned Measures.
    Maintain a highly professional, academic tone suitable for IRB submission or institutional review.
  `;
  return askAI(prompt);
}

export async function synthesizeLitInsight(
  title: string,
  authors: string,
  journal: string,
  type: 'pubmed' | 'trial' | 'semanticscholar' | 'openalex',
  projectTitle: string,
  fullTextOrAbstract?: string
) {
  const prompt = `
    You are a Quality Improvement (QI) Academic Consultant. 
    A resident is working on a clinical QI project titled "${projectTitle}".
    They found the following study in the literature:
    
    Title: ${title}
    Source: ${journal} ${authors ? `by ${authors}` : ''}
    ${fullTextOrAbstract ? `\nPaper Abstract / Content Summary:\n${fullTextOrAbstract}\n` : ''}
    
    Provide a highly rigorous, clinical, and scientific synthesis (2-3 sentences max) explaining:
    1. A concrete, quasi-experimental QI project intervention suggestion translated directly from the clinical methods or findings of this study (or the provided abstract/text summary).
    2. A structured mapping of this intervention to a specific Process Metric (what to implement), Outcome Metric (intended clinical benefit), and Balancing Metric (potential unintended workflow or safety side-effect).
    
    Structure the output with an authoritative, academic medical tone. Do NOT include markdown headings, just write a cohesive, elegant, and action-oriented paragraph.
  `;

  return askAI(prompt);
}

export async function auditSquireAndIRB(project: any, metricsCount: number, metricsLabels: string[]) {
  const prompt = `
    You are an expert Quality Improvement (QI) Auditor and Institutional Review Board (IRB) Chair specializing in SQUIRE 2.0 standards and the Federal Common Rule (45 CFR 46) for Human Subjects Research.
    Perform a highly meticulous, rigorous quality audit and IRB pre-screening determination for the following clinical QI project:
    
    Project Title: ${project.title}
    Category: ${project.category}
    Aim/Outcome: ${project.primary_outcome}
    Updates/Barriers: ${project.updates_and_barriers}
    PDSA Cycles Completed: ${project.pdsa_cycle}
    Total Patients Impacted: ${project.total_patients_impacted || 0}
    Estimated Cost Savings: $${project.estimated_cost_savings || 0}
    Metrics Data Points Count: ${metricsCount}
    Metrics Labels Tracked: ${JSON.stringify(metricsLabels)}
    
    CRITICAL AUDIT RULES:
    1. SQUIRE 2.0 SCORE (0-100):
       - Aim Clarity (up to 20 pts): Check if there is a SMART aim containing specific, measurable target percentages and timelines.
       - PDSA Iterations (up to 20 pts): Deduct points if only 0 or 1 PDSA cycle has been completed. Rigorous QI requires iterative testing.
       - Data Sufficiency (up to 20 pts): High-quality statistical process control (SPC) run charts require at least 10-12 data points. Current points: ${metricsCount}. Deduct points heavily if < 10.
       - Balancing Metrics (up to 20 pts): Check if safety, cost, time, workload, or general balancing metrics are explicitly tracked in the metrics labels list.
       - Sustainability & Maintenance Plan (up to 20 pts): Check if updates/barriers mention a maintenance plan or institutional integration.
    
    2. IRB PRE-SCREENING DETERMINATION:
       - QI/Non-Research vs. Human Subjects Research (HSR).
       - QI is defined as systemic, data-guided activities designed to bring about immediate, local improvements in clinical settings.
       - HSR is a systematic investigation, including research development, testing, and evaluation, designed to develop or contribute to generalizable knowledge.
       - Evaluate if this project deviates from standard care, randomizes patients, exposes subjects to more than minimal risk, or seeks generalizable knowledge.
    
    3. DOMAIN CHECKLIST:
       Evaluate and status each of the 5 domains as "pass" (excellent/met), "warn" (minor missing details or low count), or "fail" (absent or critical gap):
       - "pico": PICO Framing & SMART Aim
       - "pdsa": Iterative PDSA Cycles
       - "data_points": Run Chart Data Points (Min 10-12)
       - "balancing_metrics": Balancing Metrics Tracked
       - "sustainability": Sustainment/Maintenance Plan
    
    OUTPUT FORMAT:
    You MUST output ONLY a valid, raw JSON object. Do not include markdown code block syntax (like \`\`\`json). Output exactly this schema:
    {
      "squireScore": 85,
      "irbStatus": "QI (Exempt/Non-Research)",
      "irbRationale": "Detailed 2-3 sentence scholarly rationale explaining why this project is quality improvement rather than human subjects research based on federal guidelines.",
      "checklist": [
        { "id": "pico", "label": "PICO Framing & SMART Aim", "status": "pass", "details": "..." },
        { "id": "pdsa", "label": "Iterative PDSA Cycles", "status": "warn", "details": "..." },
        { "id": "data_points", "label": "Run Chart Data Points (Min 10-12)", "status": "fail", "details": "..." },
        { "id": "balancing_metrics", "label": "Balancing Metrics Tracked", "status": "fail", "details": "..." },
        { "id": "sustainability", "label": "Sustainment/Maintenance Plan", "status": "warn", "details": "..." }
      ],
      "recommendations": [
        "First actionable recommendation...",
        "Second actionable recommendation..."
      ]
    }
  `;
  return askAI(prompt);
}

export async function generateManuscriptIMRAD(project: any, metrics: any[] = [], literatureContext: string = '') {
  const metricsSummary = metrics.length > 0 
    ? `Tracked Metrics:\n${JSON.stringify(metrics.map(m => ({ label: m.label, value: m.value, date: m.created_at || m.date })), null, 2)}` 
    : 'No quantitative metrics recorded yet.';

  const prompt = `
    You are a premium Academic QI Consultant and Medical Editor.
    Draft a comprehensive, highly rigorous clinical manuscript draft following the IMRAD framework (Introduction, Methods, Results, Discussion) and SQUIRE 2.0 guidelines for this Quality Improvement project.
    
    Project Title: ${project.title}
    Category: ${project.category}
    Current Aim/Outcome: ${project.primary_outcome}
    Completed PDSA Cycles: ${project.pdsa_cycle}
    Updates, Barriers & Sustainability: ${project.updates_and_barriers}
    Patients Impacted: ${project.total_patients_impacted || 0}
    Estimated Cost Savings: $${project.estimated_cost_savings || 0}
    ${metricsSummary}
    ${literatureContext ? `Related Literature context: ${literatureContext}` : ''}
    
    CRITICAL SCIENTIFIC & FORMATTING RULES:
    1. Write in a formal, highly scholarly medical style (similar to NEJM, BMJ Quality & Safety, or JAMA). Avoid abbreviations without definition.
    2. Incorporate concrete PICO framing in the Introduction and Methods.
    3. In the Methods, explicitly define the setting, the interdisciplinary team composition, specific process, outcome, and balancing measures, and the detailed sequence of interventions tested in each PDSA cycle.
    4. In the Results, report quantitative outcomes showing the absolute pre-to-post change (e.g. from X% baseline to Y% post-intervention, indicating a Z% absolute change and relative improvement) and patients reached.
    5. In the Discussion, integrate literature comparisons, explore systems-level limitations, analyze barriers/failures, and lay out an institutional sustainability plan.
    6. Maintain clear demarcations of each section using capitalized text headings so they can be easily parsed (e.g., "TITLE:", "INTRODUCTION:", "METHODS:", "RESULTS:", "DISCUSSION:").
    
    Draft the full manuscript now. Each section should consist of multiple complete, high-quality, academic paragraphs rather than outlines or placeholders.
  `;
  return askAI(prompt);
}

export async function generatePDSAArchitectAndRCA(project: any) {
  const prompt = `
    You are a senior Quality Improvement (QI) Academic Auditor and Clinical System Safety Engineer.
    Perform an in-depth Root Cause Analysis (RCA) and next-cycle PDSA planning based on the following project:
    
    Project Title: ${project.title}
    Category: ${project.category}
    Current Aim/Outcome: ${project.primary_outcome}
    Current Status: ${project.status}
    Updates, Barriers, & Sustainment: ${project.updates_and_barriers}
    Completed PDSA Cycles: ${project.pdsa_cycle}
    
    Perform three rigorous QI tasks and output the findings in a structured JSON schema:
    1. ISHIKAWA (FISHBONE) ANALYSIS: Identify 2-3 specific root causes or barriers in the project context across standard domains:
       - People (staffing, knowledge gaps, resistance to change, cognitive load, team buy-in)
       - Process (inefficient workflows, lack of standardized protocols, communication failures, handoffs)
       - Equipment (IT access, software limitations, EHR order set bugs, physical tool availability)
       - Environment (clinical setting, department layout, organizational culture, scheduling)
       - Materials (patient handouts, checksheets, training decks, physical templates)
    2. 5-WHYS ROOT CAUSE ANALYSIS: Detail a logical 5-step causal sequence showing why the current primary barrier or implementation gap exists, leading to a deep, actionable root cause.
    3. NEXT CYCLE PDSA ROADMAP: Map out an actionable, high-yield plan for the NEXT PDSA cycle based on the root causes:
       - Plan: Detailed objective, questions to answer, prediction, and specific task assignments. Align with IHI standards.
       - Do: Precise implementation steps, risk mitigation, and data collection details.
       - Study: Exact analysis plans, comparing data to predictions, and run chart checking thresholds.
       - Act: Clear thresholds and trigger criteria for whether to adopt, adapt, or abandon the intervention.
       
    OUTPUT FORMAT:
    You MUST output ONLY a valid, raw JSON object. Do not include markdown code block syntax (like \`\`\`json). Output exactly this schema:
    {
      "ishikawa": {
        "people": ["Cause 1", "Cause 2"],
        "process": ["Cause 1", "Cause 2"],
        "equipment": ["Cause 1", "Cause 2"],
        "environment": ["Cause 1", "Cause 2"],
        "materials": ["Cause 1", "Cause 2"]
      },
      "fiveWhys": [
        "Why 1: Initial superficial symptom/barrier...",
        "Why 2: Deeper process/human factor...",
        "Why 3: Contextual constraint...",
        "Why 4: Systemic or structural problem...",
        "Why 5: Ultimate actionable organizational/workflow root cause."
      ],
      "pdsaRoadmap": {
        "plan": "Detailed Plan description under SQUIRE/IHI standards.",
        "do": "Detailed Do description.",
        "study": "Detailed Study description.",
        "act": "Detailed Act description."
      }
    }
  `;
  return askAI(prompt);
}

// ==========================================
// = NEW SCIENTIFIC & CLINICAL AI UTILITIES =
// ==========================================

export async function generateIRBExemptionAdvisor(project: any) {
  const prompt = `
    You are an expert Institutional Review Board (IRB) Chair and Compliance Consultant specializing in the Federal Common Rule (45 CFR 46) and FDA regulations.
    Analyze the following Quality Improvement (QI) project and draft a highly rigorous, formal, and publication-safe IRB QI Determination & Exemption Application.
    
    Project Title: ${project.title}
    Category: ${project.category}
    SMART Aim/Outcome: ${project.primary_outcome}
    Interventions & Process: ${project.updates_and_barriers}
    PDSA Cycles: ${project.pdsa_cycle}
    
    Structure your response with clear, professional sections:
    1. EXECUTIVE QI DETERMINATION: Explicitly state whether the project meets the definition of Human Subjects Research (HSR) under 45 CFR 46.102(l) or is classified as non-research Quality Improvement.
    2. SCIENTIFIC JUSTIFICATION & 45 CFR 46 MAPPING: Draft a formal, 2-3 paragraph academic rationale highlighting that:
       - The activity is a systematic, data-guided intervention designed to bring about immediate, local clinical improvement within a single institution.
       - No intent to contribute to generalizable knowledge (which does not prevent publication under SQUIRE guidelines).
       - Patients are not subjected to randomized experimental protocols or risk exceeding standard clinical practice.
    3. ETHICAL MITIGATION PROTOCOL: Provide a short list of clinical and administrative steps (e.g., aggregate data analysis, no patient-level identifiers in publication, administrative oversight) to guarantee human subjects safety.
    4. GME INSTITUTIONAL LETTER DRAFT: Provide a formal template letter (signed by the GME Research Director / IRB Chair) that the resident can copy/paste to document institutional exemption.
    
    Keep the tone authoritative, highly academic, legally sound, and protective of patient privacy.
  `;
  return askAI(prompt);
}

export async function analyzeSPCRunChart(projectTitle: string, metrics: any[]) {
  const metricsData = metrics && metrics.length > 0 
    ? JSON.stringify(metrics.map(m => ({ date: m.created_at || m.date || 'N/A', label: m.label, value: m.value })), null, 2)
    : 'No metrics data provided.';

  const prompt = `
    You are an expert biostatistician and Quality Improvement Methodologist specializing in Statistical Process Control (SPC) and IHI Run Chart rules.
    Analyze the following metrics dataset for a project titled "${projectTitle}" against standard IHI run chart rules.
    
    Metrics Dataset:
    ${metricsData}
    
    CRITICAL ANALYSIS CRITERIA:
    Assess the data series systematically for the four IHI Run Chart Rules:
    1. RULE 1: SHIFT - A shift is defined as 6 or more consecutive points either all above or all below the median line. (Note: values exactly on the median do not count and do not break the shift; skip them).
    2. RULE 2: TREND - A trend is defined as 5 or more consecutive points continuously increasing or continuously decreasing. (Note: flat connections between equal consecutive points do not count and do not break the trend; skip them).
    3. RULE 3: RUNS (TOO MANY OR TOO FEW) - Count the number of runs (crossings of the median line plus one) and determine if the count is outside the IHI statistical threshold table limits for the number of data points.
    4. RULE 4: ASTRONOMICAL POINT - Identify any singular, extreme outlier data point that represents a non-random, obvious system disruption.
    
    PROVIDE A DETAILED REPORT:
    - EXECUTIVE STATISTICAL SUMMARY: State the baseline median, post-intervention median, and the absolute and relative delta changes.
    - RULE-BY-RULE AUDIT: For each of the 4 rules, provide a clear, mathematical evaluation (e.g., "Shift Detected: No, max consecutive points above/below median is 4").
    - CLINICAL & SYSTEMS SIGNIFICANCE: Draft a scholarly paragraph translating these run chart statistics into real clinical meaning (e.g., "This shift of 7 points confirms that the standardized EMR order set created a non-random, statistically significant process improvement rather than minor noise...").
    
    Maintain a highly rigorous, scientific, and authoritative biostatistical tone.
  `;
  return askAI(prompt);
}

export async function simulatePeerReview(project: any, abstractText: string, manuscriptText: string) {
  const prompt = `
    You are a highly demanding, rigorous, and expert peer reviewer for leading healthcare quality journals (such as BMJ Quality & Safety, Joint Commission Journal on Quality and Patient Safety, or JAMA).
    Perform an adversarial, constructive peer review of the following QI project abstract and manuscript draft.
    
    Project Title: ${project.title}
    Aim/Outcome: ${project.primary_outcome}
    Abstract:
    ${abstractText}
    
    Manuscript Draft:
    ${manuscriptText}
    
    STRUCTURE YOUR ADVERSARIAL PEER REVIEW:
    1. METHODOLOGICAL CRITIQUE (Reviewer #2 Perspective): Identify potential weaknesses in the QI methodology (e.g., unclear SMART aim, insufficient baseline data points, lack of balancing/safety metrics, weak interdisciplinary workflow definition, risk of bias, or secular trends).
    2. DATA & STATISTICAL RIGOR: Critique the run chart or statistical process control reporting. Check if pre/post deltas are absolute or relative, if patient volumes are specified, and if the data supports the claims of improvement.
    3. SUSTAINABILITY & SYSTEMS AUDIT: Critique the sustainment plan. Check if the project is vulnerable to "staff fatigue" or "EMR updates" and whether standard operating procedures (SOPs) are fully integrated.
    4. ACTIONABLE ROADMAP FOR ACCEPTANCE: Provide 3-4 specific, high-yield revisions or additional details the authors MUST include to satisfy the review board and achieve rapid acceptance.
    
    Keep the tone scholarly, highly critical yet constructive, precise, and authentic to elite medical journal standards.
  `;
  return askAI(prompt);
}

export async function generateEMRSpecification(project: any, metrics: any[]) {
  const metricsData = metrics && metrics.length > 0 
    ? JSON.stringify(metrics.map(m => ({ date: m.created_at || m.date || 'N/A', label: m.label, value: m.value })), null, 2)
    : 'No metrics data provided.';

  const prompt = `
    You are a Senior Clinical Informatics Architect and Lead EHR Analyst specializing in Epic and Cerner systems engineering.
    Translate the following Quality Improvement (QI) project into a highly formal, comprehensive EHR Analyst Build Request and Clinical Informatics Specification Sheet.
    
    Project Title: ${project.title}
    Category: ${project.category}
    SMART Aim/Outcome: ${project.primary_outcome}
    EHR Context & Workflow: ${project.updates_and_barriers}
    Project Metrics:
    ${metricsData}
    
    Structure your specification with four detailed technical sections:
    1. CLINICAL DECISION SUPPORT & BPA LOGIC: Define the trigger logic, criteria, and workflow integration for a Best Practice Advisory (BPA) or system alert. Include specific EHR trigger points (e.g., patient age, admission diagnosis, specific lab values, ordering events) and the expected user actions (e.g., direct-link order placement, snooze criteria, reason for override).
    2. EHR ORDER SET & WORKFLOW BUILD: Specify a formal order set, medication preference list, or clinical pathway build specification. Define the standard pre-selected orders, default dosing/frequencies, custom clinical guidelines text to embed, and smart text configurations.
    3. CLINICAL DOCUMENTATION & SMARTPHRASE: Draft a high-yield, interdisciplinary SmartPhrase (.dotphrase or AutoText template) designed to standardize clinical documentation, capture quality metrics at the point of care, and reduce cognitive load for clinical staff. Incorporate interactive wildcards (e.g., {***}) and standard EHR smart links (e.g., @NAME@, @AGE@, @LATESTBP@).
    4. CDW ANALYTICS & DATA WAREHOUSE DICTIONARY: Detail the precise Clinical Data Warehouse (CDW) reporting criteria. Specify the SQL table joins (e.g., Epic Clarity/Caboodle table domains), raw database fields (e.g., PAT_ENC, ORDER_FACT, CLARITY_MED), exclusion criteria, and automated dashboard scheduling parameters for longitudinal quality tracking.
    
    Maintain an extremely precise, professional clinical informatics tone, using actual EHR analyst nomenclature (Epic Caboodle/Clarity schema domains, BPA triggering contexts, SmartText tokens).
  `;
  return askAI(prompt);
}

export async function mapCFIRFramework(project: any) {
  const prompt = `
    You are a premium Academic QI Consultant and expert in Implementation Science frameworks, particularly the Consolidated Framework for Implementation Research (CFIR 2.0) and the ERIC (Expert Recommendations for Implementing Change) taxonomy.
    Analyze the following Quality Improvement (QI) project for implementation barriers and map them to CFIR 2.0 domains and evidence-based ERIC strategies.
    
    Project Title: ${project.title}
    Category: ${project.category}
    SMART Aim/Outcome: ${project.primary_outcome}
    Interventions & Process: ${project.updates_and_barriers}
    PDSA Cycles: ${project.pdsa_cycle}
    
    CRITICAL IMPLEMENTATION SCIENCE ANALYSIS:
    1. CFIR 2.0 DOMAINS: Map the project context and barriers across the 5 core domains:
       - Innovation Characteristics (e.g., relative advantage, adaptability, complexity)
       - Outer Setting (e.g., patient needs, external policies, pressure to implement)
       - Inner Setting (e.g., culture, leadership engagement, resources, relative priority)
       - Characteristics of Individuals (e.g., self-efficacy, stage of change, identification with organization)
       - Process of Implementation (e.g., planning, engaging champions, executing, reflecting)
    2. ERIC TAXONOMY STRATEGIES: For each mapped barrier, suggest 1-2 highly specific strategies from the Expert Recommendations for Implementing Change (ERIC) taxonomy (e.g., identifying champions, conducting educational meetings, developing clinical pathways, auditing and providing feedback).
    3. SUSTAINABILITY ASSESSMENT: Calculate a qualitative Sustainability Score (0-100) and provide a professional, scholarly justification.
    
    OUTPUT FORMAT:
    You MUST output ONLY a valid, raw JSON object. Do not include markdown code block syntax (like \`\`\`json). Output exactly this schema:
    {
      "domains": [
        {
          "name": "Innovation Characteristics",
          "barriers": ["List of barriers identified in this domain"],
          "strategies": ["Specific ERIC strategy mapped to these barriers"],
          "details": "Scholarly explanation of the barrier and strategic mitigation strategy."
        },
        {
          "name": "Outer Setting",
          "barriers": [],
          "strategies": [],
          "details": "..."
        },
        {
          "name": "Inner Setting",
          "barriers": [],
          "strategies": [],
          "details": "..."
        },
        {
          "name": "Characteristics of Individuals",
          "barriers": [],
          "strategies": [],
          "details": "..."
        },
        {
          "name": "Process of Implementation",
          "barriers": [],
          "strategies": [],
          "details": "..."
        }
      ],
      "sustainabilityScore": 80,
      "sustainabilityJustification": "2-3 sentences of scholarly justification regarding long-term implementation viability."
    }
  `;
  return askAI(prompt);
}

export async function findJournalFit(project: any) {
  const prompt = `
    You are an expert Medical Journal Editor and Academic QI Publication Scout.
    Analyze the following Quality Improvement (QI) project title, category, outcome, and updates to recommend the top 3 healthcare quality or clinical journals for dissemination.
    
    Project Title: ${project.title}
    Category: ${project.category}
    SMART Aim/Outcome: ${project.primary_outcome}
    Interventions & Process: ${project.updates_and_barriers}
    PDSA Cycles: ${project.pdsa_cycle}
    
    CRITICAL PUBLICATION SCOUTING CRITERIA:
    1. Select the top 3 journals that have a strong track record of publishing QI research (e.g., BMJ Quality & Safety, Joint Commission Journal on Quality and Patient Safety (JCJQPS), American Journal of Medical Quality (AJMQ), Journal for Healthcare Quality (JHQ), or relevant clinical specialty journals).
    2. Detail the Impact Factor group (e.g., High, Medium, Low with approximate IF).
    3. Provide accurate word limits for Abstract and Manuscript formats.
    4. Outline key formatting and checklist rules (e.g., SQUIRE 2.0 compliance, clinical trials registration if applicable, specific sections required).
    5. Evaluate acceptance probability and supply a clear publication rationale.
    
    OUTPUT FORMAT:
    You MUST output ONLY a valid, raw JSON object. Do not include markdown code block syntax (like \`\`\`json). Output exactly this schema:
    {
      "journals": [
        {
          "name": "Journal Name",
          "impactFactor": "Approx. X.X (Category)",
          "abstractLimit": "X words",
          "manuscriptLimit": "Y words",
          "formattingRules": ["Rule 1 (e.g., SQUIRE 2.0 Checklist)", "Rule 2"],
          "acceptanceProbability": "High/Medium/Low",
          "rationale": "Scholarly rationale mapping the project's clinical relevance to the journal's editorial scope."
        }
      ]
    }
  `;
  return askAI(prompt);
}

export async function adviseStatisticalPower(project: any) {
  const prompt = `
    You are a Senior Biostatistician and Quality Improvement Methodologist specializing in quasi-experimental clinical studies and statistical power calculations.
    Analyze the following Quality Improvement (QI) project parameters to extract clinical PICO elements and provide robust statistical methodology advice.
    
    Project Title: ${project.title}
    Category: ${project.category}
    SMART Aim/Outcome: ${project.primary_outcome}
    Interventions & Process: ${project.updates_and_barriers}
    PDSA Cycles: ${project.pdsa_cycle}
    
    CRITICAL STATISTICAL METHODOLOGY GUIDELINES:
    1. PICO ANALYSIS: Extract the Population, Intervention, Comparison, and Outcome elements directly from the project's clinical description.
    2. RECOMMENDED TESTS: Suggest the 2-3 most appropriate statistical tests based on the study design (e.g., McNemar's test for paired binary proportions, Paired t-test or Wilcoxon Signed-Rank test for continuous data, Chi-Square test for independent proportions, or Segmented Regression of Interrupted Time Series (ITS) for longitudinal run chart analysis).
    3. POWER & SAMPLE SIZE ADVICE: Provide a detailed guideline for Minimum Detectable Effect Size (MDES), sample size rules-of-thumb based on typical QI projects, and a clear biostatistical justification.
    
    OUTPUT FORMAT:
    You MUST output ONLY a valid, raw JSON object. Do not include markdown code block syntax (like \`\`\`json). Output exactly this schema:
    {
      "pico": {
        "population": "Target patient population...",
        "intervention": "The QI intervention tested...",
        "comparison": "Baseline or control group comparison...",
        "outcome": "Primary and secondary outcome measures..."
      },
      "recommendedTests": [
        {
          "testName": "Name of Statistical Test",
          "useCase": "Specific scenario when this test is indicated in this project",
          "rationale": "Clear biostatistical justification explaining why this test is appropriate."
        }
      ],
      "sampleSizeAdvice": {
        "mdes": "Recommended Minimum Detectable Effect Size...",
        "sampleSizeRuleOfThumb": "Recommended sample size / patient volume rules-of-thumb...",
        "justification": "Detailed biostatistical rationale explaining how patient volume affects run chart stability and statistical significance."
      }
    }
  `;
  return askAI(prompt);
}

