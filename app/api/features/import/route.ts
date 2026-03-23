import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface CSVRow {
  id: string;
  category: string;
  category_slug: string;
  subcategory: string;
  subcategory_slug: string;
  sequence: string;
  feature_text: string;
  hint_text: string;
}

function parseCSV(text: string): CSVRow[] {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());

    if (values.length === headers.length) {
      rows.push({
        id: values[0],
        category: values[1],
        category_slug: values[2],
        subcategory: values[3],
        subcategory_slug: values[4],
        sequence: values[5],
        feature_text: values[6],
        hint_text: values[7],
      });
    }
  }

  return rows;
}

export async function POST(request: NextRequest) {
  try {
    const text = await request.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid rows found in CSV' }, { status: 400 });
    }

    const features = rows.map(row => {
      const isSubgroup = row.subcategory && !row.feature_text;

      return {
        category: row.category,
        subcategory: row.subcategory || null,
        sequence: parseInt(row.sequence, 10),
        feature_text: row.feature_text || row.subcategory,
        hint_text: row.hint_text || null,
        is_subgroup: isSubgroup,
      };
    });

    const { count } = await supabaseAdmin
      .from('features')
      .select('*', { count: 'exact', head: true });

    if (count && count > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('features')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return NextResponse.json({
          error: 'Failed to clear existing features',
          details: deleteError.message
        }, { status: 500 });
      }
    }

    const { error: insertError } = await supabaseAdmin
      .from('features')
      .insert(features);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: features.length });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Failed to import features' }, { status: 500 });
  }
}
