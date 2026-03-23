import { notFound, redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAllFeatures, getResponsesForOrganisation, getCategories, getCategoryProgress } from '@/lib/db-helpers';
import { OrganisationResponses } from '@/components/organisation-responses';
import { Organisation } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getOrganisation(orgId: string): Promise<Organisation | null> {
  const { data, error } = await supabase
    .from('organisations')
    .select('*')
    .eq('id', orgId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching organisation:', error);
    return null;
  }

  return data;
}

export default async function OrganisationDetailPage({
  params,
}: {
  params: { orgId: string };
}) {
  const organisation = await getOrganisation(params.orgId);

  if (!organisation) {
    notFound();
  }

  const features = await getAllFeatures();
  const responses = await getResponsesForOrganisation(organisation.id);
  const categories = await getCategories();
  const progress = await getCategoryProgress(organisation.id, categories);

  const responsesByFeature = new Map(
    features.map((feature) => [
      feature.id,
      responses.filter((response) => response.feature_id === feature.id),
    ])
  );
  const featuresWithResponses = features.map((feature) => {
    const featureResponses = responsesByFeature.get(feature.id) || [];
    return {
      ...feature,
      response: featureResponses[0] || null,
      responses: featureResponses,
    };
  });

  return (
    <OrganisationResponses
      organisation={organisation}
      features={featuresWithResponses}
      categories={categories}
      progress={progress}
    />
  );
}
