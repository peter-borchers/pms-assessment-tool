import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const subcategory = searchParams.get('subcategory');

  try {
    let query = supabase
      .from('features')
      .select('*')
      .order('sequence', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    if (subcategory) {
      query = query.eq('subcategory', subcategory);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching features:', error);
      return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, subcategory, feature_text, hint_text, sequence, is_subgroup } = body;

    if (!category || !subcategory || !feature_text) {
      return NextResponse.json(
        { error: 'Category, subcategory, and feature text are required' },
        { status: 400 }
      );
    }

    const insertData: any = {
      category,
      subcategory,
      feature_text,
      hint_text: hint_text || null,
      sequence: sequence || null,
      is_subgroup: is_subgroup || false,
      is_active: true,
    };

    const { data, error } = await supabaseAdmin
      .from('features')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating feature:', error);
      return NextResponse.json({
        error: error.message || 'Failed to create feature',
        details: error
      }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, feature_text, hint_text, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Feature ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (feature_text !== undefined) updateData.feature_text = feature_text;
    if (hint_text !== undefined) updateData.hint_text = hint_text;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('features')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating feature:', error);
      return NextResponse.json({
        error: error.message || 'Failed to update feature',
        details: error
      }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log('DELETE request received for feature ID:', id);

    if (!id) {
      return NextResponse.json({ error: 'Feature ID is required' }, { status: 400 });
    }

    const { error, data } = await supabaseAdmin
      .from('features')
      .delete()
      .eq('id', id)
      .select();

    console.log('Delete result:', { error, data });

    if (error) {
      console.error('Error deleting feature:', error);
      return NextResponse.json({
        error: error.message || 'Failed to delete feature',
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: data });
  } catch (error) {
    console.error('DELETE Error caught:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error',
      details: error
    }, { status: 500 });
  }
}
