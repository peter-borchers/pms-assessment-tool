import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organisationId = searchParams.get('organisationId');
  const category = searchParams.get('category');
  const subcategory = searchParams.get('subcategory');

  if (!organisationId || !category || !subcategory) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('user_feature_notes')
    .select('*')
    .eq('organisation_id', organisationId)
    .eq('category', category)
    .eq('subcategory', subcategory)
    .maybeSingle();

  if (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notes: data?.notes || '' });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { organisationId, category, subcategory, notes } = body;

  if (!organisationId || !category || !subcategory) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('user_feature_notes')
    .upsert(
      {
        organisation_id: organisationId,
        category,
        subcategory,
        notes: notes || '',
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'organisation_id,category,subcategory',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error saving notes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
