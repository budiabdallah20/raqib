import { NextResponse } from 'next/server';
import { logoutCurrentSession } from '@/lib/auth';

export async function POST(request: Request) {
  return logoutCurrentSession(NextResponse.json({ ok: true }), request);
}
