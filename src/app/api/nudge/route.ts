import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { leadEmails, projectTitle, daysSinceUpdate, lastUpdated } = await request.json();

        if (!leadEmails || !projectTitle) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await resend.emails.send({
            from: 'QI Chief <onboarding@resend.dev>', // Default testing domain. User must verify their own domain for production.
            to: leadEmails.split(','), // Accepts array of strings
            subject: `Action Required: QI Project Update (${projectTitle})`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>QI Project Update Request</h2>
          <p>Hello Project Lead,</p>
          <p>This is an automated nudge regarding your project: <strong>${projectTitle}</strong>.</p>
          <p>Our records show it hasn't been updated in <strong>${daysSinceUpdate} days</strong> (Last update: ${lastUpdated}).</p>
          <p>Please log in to the QI Tracker and update your "Updates and Barriers" section to keep the dashboard current.</p>
          <br/>
          <a href="https://alhayekbakr1-cell.github.io/QI_Tracker/" style="background-color: #003B5C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to QI Tracker</a>
          <br/><br/>
          <p>Thank you,<br/>QI Chief</p>
        </div>
      `,
        });

        if (error) {
            return NextResponse.json({ error }, { status: 400 });
        }

        return NextResponse.json({ message: 'Email sent successfully', id: data?.id });
    } catch (err) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
