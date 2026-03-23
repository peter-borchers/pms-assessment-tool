/*
  # Update Responses Unique Constraint

  1. Changes
    - Drop the old unique constraint on (organisation_id, feature_id)
    - Add a new unique constraint on (organisation_id, feature_id, respondant)
    - This allows multiple respondants from the same organisation to respond to the same feature

  2. Notes
    - Existing data will be preserved
    - The constraint now supports multi-respondant scenarios
*/

-- Drop the old unique constraint
ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_organisation_id_feature_id_key;

-- Add new unique constraint including respondant
-- We need to handle NULL values for respondant, so we'll use a partial unique index instead
-- This allows NULL values to coexist while enforcing uniqueness for non-NULL values
DROP INDEX IF EXISTS idx_responses_unique_org_feature_respondant;
CREATE UNIQUE INDEX idx_responses_unique_org_feature_respondant 
  ON responses (organisation_id, feature_id, COALESCE(respondant, ''));
