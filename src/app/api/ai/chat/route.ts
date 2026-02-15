import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { message, chapter } = await req.json();

        // In a production environment, you would call OpenAI/Anthropic here:
        // const response = await openai.chat.completions.create({...})

        // For this implementation, we provide a "Smart QI Simulator" that delivers 
        // high-quality, context-aware advice based on the active handbook chapter.

        let advice = "";

        if (chapter === 'fundamentals') {
            advice = "Your PDSA cycles should be small. When using the PDSA Worksheet, focus on one specific change (e.g., 'One nurse on 3 South'). Don't try to solve the whole problem in one cycle.";
        } else if (chapter === 'team') {
            advice = "For your Power/Interest grid, identify your 'Blockers' early. If you're struggling with the RACI matrix, remember: only ONE person can be 'A' (Accountable). Too many leaders lead to no one leading.";
        } else if (chapter === 'design-tools') {
            advice = "When using the 5 Whys tool, don't stop at the surface. If you end up at 'Human Error', ask Why again! The root cause is usually a system-process failure, not a person.";
        } else if (chapter === 'analysis') {
            advice = "Looking at your Pareto Chart? Focus on the 'Vital Few'. Addressing the first two categories often solves 80% of the defects. Don't waste time on the 'Useful Many' until the big issues are gone.";
        } else if (chapter === 'timeline') {
            advice = "The 'Valley of Despair' happens around month 4. If your Gantt chart shows you're behind, look at your PDSA cycles. Are they too big? Shrink the test to regain momentum.";
        } else {
            advice = "Focus on your SMART AIM. Use the IRB Determination tool early—it's much easier to get QI status than to retroactively fix research compliance issues.";
        }

        // Simulate AI thinking and return the advice
        return NextResponse.json({
            message: `[AI Consultant]: Regarding your question on ${chapter || 'QI'}... ${advice} \n\n(Note: This is a context-aware simulation using AdventHealth QI Guidelines. LIVE LLM connection available in Settings.)`
        });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
    }
}
