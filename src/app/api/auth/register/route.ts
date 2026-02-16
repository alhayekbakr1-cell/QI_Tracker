import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { email, password, fullName } = await request.json()

        if (!email || !password || !fullName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Initialize Supabase Admin client with Service Role Key
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Create user with auto-confirmed email using hidden institutional secret
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: process.env.INSTITUTIONAL_SECRET!,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
            }
        })

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status || 500 }
            )
        }

        return NextResponse.json({
            message: 'User registered successfully',
            user: data.user
        })

    } catch (error: any) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
