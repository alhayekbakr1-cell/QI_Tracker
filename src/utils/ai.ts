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
