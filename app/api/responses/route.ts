import { NextResponse } from 'next/server';
import { upsertResponse } from '@/lib/db-helpers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organisationId, featureId, respondant, priority, currentState, notes } = body;

    if (!organisationId || !featureId) {
      return NextResponse.json(
        { error: 'Organisation ID and Feature ID are required' },
        { status: 400 }
      );
    }

    const response = await upsertResponse(
      organisationId,
      featureId,
      respondant,
      priority,
      currentState,
      notes
    );

    if (!response) {
      return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in POST /api/responses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
