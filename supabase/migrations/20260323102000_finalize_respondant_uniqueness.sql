/*
  # Finalize multi-respondant response storage

  1. Changes
    - Ensure `respondant` exists on `responses`
    - Normalize existing null values to empty string
    - Make `respondant` non-null with a default empty string
    - Enforce uniqueness on (organisation_id, feature_id, respondant)

  2. Notes
    - Empty string represents the shared/default respondent for backwards compatibility
    - This shape allows regular Postgres upserts using the exact conflict columns
*/

ALTER TABLE responses
ADD COLUMN IF NOT EXISTS respondant text;

UPDATE responses
SET respondant = ''
WHERE respondant IS NULL;

ALTER TABLE responses
ALTER COLUMN respondant SET DEFAULT '';

ALTER TABLE responses
ALTER COLUMN respondant SET NOT NULL;

DROP INDEX IF EXISTS idx_responses_unique_org_feature_respondant;

ALTER TABLE responses
DROP CONSTRAINT IF EXISTS responses_organisation_id_feature_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'responses_organisation_id_feature_id_respondant_key'
  ) THEN
    ALTER TABLE responses
    ADD CONSTRAINT responses_organisation_id_feature_id_respondant_key
    UNIQUE (organisation_id, feature_id, respondant);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_responses_respondant ON responses(respondant);
CREATE INDEX IF NOT EXISTS idx_responses_org_feature_respondant
  ON responses(organisation_id, feature_id, respondant);
