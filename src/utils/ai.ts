import { createClient } from "./supabase/client";

const supabase = createClient();

export async function askAI(prompt: string) {
  const { data, error } = await supabase.functions.invoke('qi-consultant', {
    body: { prompt }
  });

  if (error) throw error;
  return data.text;
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

export async function getQIAdvice(question: string, context?: string, handbookContent?: string) {
  const prompt = `
    You are a Quality Improvement (QI) Academic Consultant at AdventHealth.
    The resident is asking a question about QI methodology. 
    
    HANDBOOK CONTEXT (Follow these rules and terminology):
    ${handbookContent || "Standard QI Best Practices (SQUIRE 2.0, PDSA)."}
    
    Resident Question: ${question}
    ${context ? `Specific Project Context: ${context}` : ''}
    
    Provide a scholarly, and helpful response. Be concise but cite specific steps from the handbook if provided.
  `;
  return askAI(prompt);
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
  const prompt = `
    You are a Quality Improvement (QI) Academic Scout.
    Search the web for the official abstract submission deadline for the next "${conferenceName}" conference.
    
    CRITICAL:
    1. Look for the exact date and year (e.g., Nov 24, 2026).
    2. Identify the official website URL.
    3. If the date is not yet announced, provide the estimated month based on historical data.
    
    Output format:
    {"deadline": "ISO DATE", "displayDate": "Readable Date", "url": "URL", "confidence": "High/Medium/Low", "notes": "Brief explanation"}
    
    Output ONLY the JSON.
  `;
  return askAI(prompt);
}
export async function generateAbstract(project: any) {
  const prompt = `
    You are a Quality Improvement (QI) Academic Consultant. 
    Write a formal, publication-ready abstract for the following QI project.
    
    Project Title: ${project.title}
    Category: ${project.category}
    Current Status: ${project.status}
    Primary Outcome: ${project.primary_outcome}
    PDSA Cycles: ${project.pdsa_cycle}
    Updates/Barriers: ${project.updates_and_barriers}
    Patients Impacted: ${project.total_patients_impacted || 0}
    Cost Savings: $${project.estimated_cost_savings || 0}
    
    Structure the abstract with the following headings:
    BACKGROUND:
    METHODS:
    RESULTS:
    CONCLUSIONS:
    
    Keep it scholarly, concise, and professional. Output ONLY the abstract text.
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
