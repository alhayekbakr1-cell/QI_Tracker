import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { error: 'Institutional email is required' },
                { status: 400 }
            )
        }

        if (!email.toLowerCase().endsWith('@adventhealth.com')) {
            return NextResponse.json(
                { error: 'Access is restricted to @adventhealth.com addresses' },
                { status: 403 }
            )
        }

        const supabase = await createClient()

        // Sign in using the hidden institutional secret
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: process.env.INSTITUTIONAL_SECRET!,
        })

        if (error) {
            // If user doesn't exist, we might want to tell them to register
            // or we could automatically register them if they are in the directory.
            // For now, let's keep it simple: if login fails, they need to register.
            return NextResponse.json(
                { error: 'Institutional ID not found. Please register first.' },
                { status: 401 }
            )
        }

        return NextResponse.json({ message: 'Login successful' })

    } catch (error: any) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
