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

export async function getQIAdvice(question: string, context?: string) {
  const prompt = `
    You are a Quality Improvement (QI) Academic Consultant.
    The user is asking a question about QI methodology. 
    Question: ${question}
    ${context ? `Project Context: ${context}` : ''}
    
    Provide a brief, scholarly, and helpful 3-4 sentence response.
  `;
  return askAI(prompt);
}

export async function generateExecutiveReport(projectsSummary: string) {
  const prompt = `
    You are a Quality Improvement (QI) Chief Consultant.
    Analyze the following summary of current QI projects and generate a high-level executive report for the hospital leadership.
    Focus on:
    - Overall institutional progress.
    - Identification of categories with highest activity.
    - Summary of common barriers.
    
    Summary Data:
    ${projectsSummary}
    
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
