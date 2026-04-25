// Static export: middleware is not supported on GitHub Pages.
// This file is a no-op stub kept for import compatibility.
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  return NextResponse.next({ request })
}
