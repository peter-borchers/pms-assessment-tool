import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('features')
      .select('category, subcategory')
      .order('category')
      .order('subcategory');

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    const categoryMap = new Map<string, Set<string>>();

    data.forEach((item) => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, new Set());
      }
      if (item.subcategory) {
        categoryMap.get(item.category)!.add(item.subcategory);
      }
    });

    const categories = Array.from(categoryMap.entries()).map(([category, subcategories]) => ({
      category,
      subcategories: Array.from(subcategories).sort(),
    }));

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
