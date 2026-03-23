import { redirect } from 'next/navigation';
import { getOrganisationByCode, getResponsesForOrganisation, getCategoryNotes } from '@/lib/db-helpers';
import { supabase } from '@/lib/supabase';
import { CategoryQuestionnaire } from '@/components/category-questionnaire';
import { Feature } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getFeaturesByCategoryAndSubcategory(
  category: string,
  subcategory: string
): Promise<Feature[]> {
  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('category', category)
    .eq('subcategory', subcategory)
    .order('sequence', { ascending: true });

  if (error) {
    console.error('Error fetching features by category and subcategory:', error);
    return [];
  }

  return data || [];
}

export default async function SubcategoryPage({
  params,
  searchParams,
}: {
  params: { orgCode: string; category: string; subcategory: string };
  searchParams?: { respondant?: string | string[] };
}) {
  const organisation = await getOrganisationByCode(params.orgCode);

  if (!organisation) {
    redirect('/');
  }

  const respondant =
    typeof searchParams?.respondant === 'string'
      ? searchParams.respondant.trim()
      : Array.isArray(searchParams?.respondant)
      ? searchParams?.respondant[0]?.trim() ?? ''
      : '';

  const decodedCategory = decodeURIComponent(params.category);
  const decodedSubcategory = decodeURIComponent(params.subcategory);

  const features = await getFeaturesByCategoryAndSubcategory(
    decodedCategory,
    decodedSubcategory
  );
  const responses = await getResponsesForOrganisation(organisation.id);
  const categoryNotes = await getCategoryNotes(
    organisation.id,
    decodedCategory,
    decodedSubcategory
  );

  const responsesByFeature = new Map(
    features.map((feature) => [
      feature.id,
      responses.filter((response) => response.feature_id === feature.id),
    ])
  );
  const featuresWithResponses = features.map((feature) => ({
    ...feature,
    response:
      responsesByFeature.get(feature.id)?.find(
        (response) => (response.respondant ?? '') === respondant
      ) ?? null,
    responses: responsesByFeature.get(feature.id) ?? [],
  }));

  return (
    <CategoryQuestionnaire
      category={`${decodedCategory} > ${decodedSubcategory}`}
      features={featuresWithResponses}
      organisationId={organisation.id}
      respondant={respondant}
      categoryName={decodedCategory}
      subcategoryName={decodedSubcategory}
      initialCategoryNotes={categoryNotes}
    />
  );
}
