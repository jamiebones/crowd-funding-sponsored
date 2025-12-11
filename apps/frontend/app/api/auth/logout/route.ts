import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    await deleteSession();

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/auth/logout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
