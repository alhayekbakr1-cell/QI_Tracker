import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
    try {
        const { message, chapter } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            // Fallback to simulation if no API key is provided
            return NextResponse.json({
                message: `[System Notice]: LIVE AI is not yet configured. Please add GEMINI_API_KEY to .env.local to enable the real consultant. \n\n (Draft Mode): Focus on your SMART AIM for ${chapter || 'this project'}.`
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            You are the "AdventHealth QI Expert," a professional consultant designed to help Internal Medicine residents with Quality Improvement projects.
            You are currently assisting a resident who is viewing the "${chapter || 'General'}" chapter of the QI Handbook.
            
            Guidelines:
            1. Be encouraging but academically rigorous.
            2. Reference standard QI tools like PDSA, 5 Whys, and Fishbone diagrams.
            3. Keep advice clinical and practical for a hospital setting.
            4. Do NOT ask for patient PHI.
            
            The resident says: "${message}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({
            message: text
        });

    } catch (error) {
        console.error('AI Route Error:', error);
        return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
    }
}
