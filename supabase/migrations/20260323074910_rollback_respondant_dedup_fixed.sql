/*
  # Rollback Respondant Changes with Deduplication (Fixed)

  1. Changes
    - Remove duplicate responses (keep the most recent one)
    - Drop respondant-related indexes
    - Restore the original unique constraint on (organisation_id, feature_id)

  2. Notes
    - This reverts the multi-respondant functionality
    - Duplicate responses are consolidated by keeping the latest updated record
    - Restores the original single response per organisation/feature model
*/

-- Drop the unique index that includes respondant
DROP INDEX IF EXISTS idx_responses_unique_org_feature_respondant;

-- Drop respondant-related indexes
DROP INDEX IF EXISTS idx_responses_respondant;
DROP INDEX IF EXISTS idx_responses_org_feature_respondant;

-- Remove duplicates, keeping the most recently updated response for each organisation/feature pair
DELETE FROM responses
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY organisation_id, feature_id 
             ORDER BY COALESCE(updated_at, '1970-01-01'::timestamptz) DESC
           ) as rn
    FROM responses
  ) t
  WHERE rn > 1
);

-- Restore the original unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'responses_organisation_id_feature_id_key'
  ) THEN
    ALTER TABLE responses ADD CONSTRAINT responses_organisation_id_feature_id_key 
      UNIQUE (organisation_id, feature_id);
  END IF;
END $$;
