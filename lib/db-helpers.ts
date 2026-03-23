import { supabase } from './supabase';
import { Organisation, Feature, Response, CategoryProgress, SubcategoryProgress } from './types';

function normalizeRespondant(respondant?: string | null): string {
  return respondant?.trim() ?? '';
}

export async function getOrganisationByCode(code: string): Promise<Organisation | null> {
  const { data, error } = await supabase
    .from('organisations')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (error) {
    console.error('Error fetching organisation:', error);
    return null;
  }

  return data;
}

export async function getAllOrganisations(): Promise<Organisation[]> {
  const { data, error } = await supabase
    .from('organisations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching organisations:', error);
    return [];
  }

  return data || [];
}

export async function createOrganisation(
  code: string,
  name: string,
  expiresAt?: string,
  notes?: string
): Promise<{ success: boolean; data?: Organisation; error?: string }> {
  const { data, error } = await supabase
    .from('organisations')
    .insert({
      code,
      name,
      expires_at: expiresAt,
      notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating organisation:', error);

    if (error.code === '23505') {
      return { success: false, error: 'An organisation with this code already exists' };
    }

    return { success: false, error: error.message || 'Failed to create organisation' };
  }

  return { success: true, data };
}

export async function getAllFeatures(): Promise<Feature[]> {
  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('is_active', true)
    .order('sequence', { ascending: true });

  if (error) {
    console.error('Error fetching features:', error);
    return [];
  }

  return data || [];
}

export async function getFeaturesByCategory(category: string): Promise<Feature[]> {
  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('sequence', { ascending: true });

  if (error) {
    console.error('Error fetching features by category:', error);
    return [];
  }

  return data || [];
}

export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('features')
    .select('category')
    .eq('is_active', true)
    .order('sequence', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  const uniqueCategories = Array.from(new Set(data?.map((f) => f.category) || []));

  const { data: settingsData } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'CategoriesToHide')
    .maybeSingle();

  const hiddenCategories = settingsData?.value
    ? settingsData.value.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0)
    : [];

  return uniqueCategories.filter(cat => !hiddenCategories.includes(cat));
}

export interface CategoryWithSubcategories {
  category: string;
  subcategories: string[];
}

export async function getCategoriesWithSubcategories(): Promise<CategoryWithSubcategories[]> {
  const { data, error } = await supabase
    .from('features')
    .select('category, subcategory, sequence')
    .eq('is_active', true)
    .order('sequence', { ascending: true });

  if (error) {
    console.error('Error fetching categories with subcategories:', error);
    return [];
  }

  const { data: settingsData } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'CategoriesToHide')
    .maybeSingle();

  const hiddenCategories = settingsData?.value
    ? settingsData.value.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0)
    : [];

  const categoryMap = new Map<string, Set<string>>();

  data?.forEach((feature) => {
    if (hiddenCategories.includes(feature.category)) {
      return;
    }
    if (!categoryMap.has(feature.category)) {
      categoryMap.set(feature.category, new Set());
    }
    if (feature.subcategory) {
      categoryMap.get(feature.category)?.add(feature.subcategory);
    }
  });

  return Array.from(categoryMap.entries()).map(([category, subcategories]) => ({
    category,
    subcategories: Array.from(subcategories),
  }));
}

export async function getResponsesForOrganisation(
  orgId: string,
  respondant?: string | null
): Promise<Response[]> {
  let query = supabase
    .from('responses')
    .select('*')
    .eq('organisation_id', orgId)
    .order('respondant', { ascending: true })
    .order('updated_at', { ascending: false });

  if (respondant !== undefined) {
    query = query.eq('respondant', normalizeRespondant(respondant));
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching responses:', error);
    return [];
  }

  return data || [];
}

export async function upsertResponse(
  organisationId: string,
  featureId: string,
  respondant?: string | null,
  priority?: string,
  currentState?: string,
  notes?: string
): Promise<Response | null> {
  const normalizedRespondant = normalizeRespondant(respondant);
  const payload = {
    organisation_id: organisationId,
    feature_id: featureId,
    respondant: normalizedRespondant,
    priority,
    current_state: currentState,
    notes,
    updated_at: new Date().toISOString(),
  };

  const { data: existingResponses, error: existingError } = await supabase
    .from('responses')
    .select('*')
    .eq('organisation_id', organisationId)
    .eq('feature_id', featureId)
    .order('updated_at', { ascending: false });

  if (existingError) {
    console.error('Error checking existing response:', existingError);
    return null;
  }

  const existingResponse = (existingResponses || []).find(
    (response) => (response.respondant ?? '') === normalizedRespondant
  );

  if (existingResponse) {
    const { data, error } = await supabase
      .from('responses')
      .update(payload)
      .eq('id', existingResponse.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating response:', error);
      return null;
    }

    return data;
  }

  const { data, error } = await supabase
    .from('responses')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Error inserting response:', error);
    return null;
  }

  return data;
}

export async function getCategoryNotes(
  organisationId: string,
  category: string,
  subcategory: string
): Promise<string> {
  const { data, error } = await supabase
    .from('user_feature_notes')
    .select('notes')
    .eq('organisation_id', organisationId)
    .eq('category', category)
    .eq('subcategory', subcategory)
    .maybeSingle();

  if (error) {
    console.error('Error fetching category notes:', error);
    return '';
  }

  return data?.notes || '';
}

export async function getCategoryProgress(
  orgId: string,
  categories: string[],
  respondant?: string | null
): Promise<CategoryProgress[]> {
  const normalizedRespondant = normalizeRespondant(respondant);
  const features = await getAllFeatures();

  const [myResponses, allResponses] = await Promise.all([
    getResponsesForOrganisation(orgId, respondant),
    getResponsesForOrganisation(orgId),
  ]);

  const completedFeatureIds = new Set(
    myResponses.filter((r) => r.priority).map((r) => r.feature_id)
  );

  const othersFeatureIds = new Set(
    allResponses
      .filter((r) => r.priority && (r.respondant ?? '') !== normalizedRespondant)
      .map((r) => r.feature_id)
  );

  return categories.map((category) => {
    const categoryFeatures = features.filter(
      (f) => f.category === category && !f.is_subgroup
    );
    const total = categoryFeatures.length;
    const completed = categoryFeatures.filter((f) => completedFeatureIds.has(f.id)).length;
    const othersCompleted = categoryFeatures.filter((f) => othersFeatureIds.has(f.id)).length;

    const subcategorySet = new Set(
      features
        .filter((f) => f.category === category && f.subcategory)
        .map((f) => f.subcategory!)
    );

    const subcategories: SubcategoryProgress[] = Array.from(subcategorySet).map((subcategory) => {
      const subFeatures = features.filter(
        (f) => f.category === category && f.subcategory === subcategory && !f.is_subgroup
      );
      const subTotal = subFeatures.length;
      const subCompleted = subFeatures.filter((f) => completedFeatureIds.has(f.id)).length;
      const subOthersCompleted = subFeatures.filter((f) => othersFeatureIds.has(f.id)).length;

      return {
        subcategory,
        total: subTotal,
        completed: subCompleted,
        othersCompleted: subOthersCompleted,
        percentage: subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0,
      };
    });

    return {
      category,
      total,
      completed,
      othersCompleted,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      subcategories: subcategories.length > 0 ? subcategories : undefined,
    };
  });
}
