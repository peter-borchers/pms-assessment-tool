export interface Organisation {
  id: string;
  code: string;
  name: string;
  created_at: string;
  expires_at?: string | null;
  notes?: string | null;
  completedCount?: number;
}

export interface Feature {
  id: string;
  category: string;
  subcategory?: string | null;
  sequence: number;
  feature_text: string;
  hint_text?: string | null;
  is_subgroup: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Response {
  id: string;
  organisation_id: string;
  feature_id: string;
  respondant: string;
  priority?: string | null;
  current_state?: string | null;
  notes?: string | null;
  updated_at: string;
}

export type PriorityLevel = 'Must Have' | 'Should Have' | 'Nice to Have' | 'Not Required';

export interface FeatureWithResponse extends Feature {
  response?: Response | null;
  responses?: Response[];
}

export interface CategoryProgress {
  category: string;
  total: number;
  completed: number;
  othersCompleted: number;
  percentage: number;
  subcategories?: SubcategoryProgress[];
}

export interface SubcategoryProgress {
  subcategory: string;
  total: number;
  completed: number;
  othersCompleted: number;
  percentage: number;
}
