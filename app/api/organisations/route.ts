import { NextResponse } from 'next/server';
import { createOrganisation, getAllOrganisations } from '@/lib/db-helpers';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const organisations = await getAllOrganisations();

    const orgsWithStats = await Promise.all(
      organisations.map(async (org) => {
        const { count } = await supabase
          .from('responses')
          .select('*', { count: 'exact', head: true })
          .eq('organisation_id', org.id)
          .not('priority', 'is', null);

        return {
          ...org,
          completedCount: count || 0,
        };
      })
    );

    return NextResponse.json(orgsWithStats);
  } catch (error) {
    console.error('Error in GET /api/organisations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, expiresAt, notes } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      );
    }

    const result = await createOrganisation(code, name, expiresAt, notes);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/organisations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
