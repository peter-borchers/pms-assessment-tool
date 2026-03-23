import { NextRequest, NextResponse } from 'next/server';
import { getCategories, getCategoryProgress } from '@/lib/db-helpers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orgId = searchParams.get('orgId');
  const respondant = searchParams.get('respondant');

  if (!orgId) {
    return NextResponse.json({ error: 'Organisation ID is required' }, { status: 400 });
  }

  try {
    const categories = await getCategories();
    const progress = await getCategoryProgress(orgId, categories, respondant);
    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
