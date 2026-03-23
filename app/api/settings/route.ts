import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('key');

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { key, value } = await request.json();

    console.log('PUT /api/settings - Received:', { key, value });

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)
      .select()
      .maybeSingle();

    console.log('PUT /api/settings - Update result:', { data, error });

    if (error) {
      console.error('PUT /api/settings - Database error:', error);
      throw error;
    }

    if (!data) {
      console.error('PUT /api/settings - Setting not found for key:', key);
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    console.log('PUT /api/settings - Success:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}
