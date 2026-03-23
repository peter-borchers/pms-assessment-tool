import { NextResponse } from 'next/server';
import { getOrganisationByCode } from '@/lib/db-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    console.log('[Validate] Checking code:', code);

    if (!code) {
      console.log('[Validate] No code provided');
      return NextResponse.json({ valid: false, error: 'Code is required' }, { status: 400 });
    }

    const organisation = await getOrganisationByCode(code);
    console.log('[Validate] Organisation found:', organisation ? 'Yes' : 'No');

    if (!organisation) {
      return NextResponse.json({ valid: false, error: 'Organisation not found' });
    }

    if (organisation.expires_at) {
      const expiryDate = new Date(organisation.expires_at);
      if (expiryDate < new Date()) {
        console.log('[Validate] Code expired');
        return NextResponse.json({ valid: false, error: 'Code has expired' });
      }
    }

    console.log('[Validate] Validation successful');
    return NextResponse.json({ valid: true, organisation });
  } catch (error) {
    console.error('[Validate] Error:', error);
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 });
  }
}
