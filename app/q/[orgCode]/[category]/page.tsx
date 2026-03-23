import { redirect } from 'next/navigation';
import { getOrganisationByCode, getFeaturesByCategory, getResponsesForOrganisation } from '@/lib/db-helpers';
import { CategoryQuestionnaire } from '@/components/category-questionnaire';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { orgCode: string; category: string };
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
  const features = await getFeaturesByCategory(decodedCategory);
  const responses = await getResponsesForOrganisation(organisation.id);
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
      category={decodedCategory}
      features={featuresWithResponses}
      organisationId={organisation.id}
      respondant={respondant}
    />
  );
}
