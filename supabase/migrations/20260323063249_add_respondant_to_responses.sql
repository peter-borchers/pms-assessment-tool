/*
  # Add Respondant Support to Responses

  1. Changes
    - Add `respondant` column to `responses` table to track individual respondents within an organisation
    - This allows multiple people from the same organisation to complete assessments independently
    - Responses are now uniquely identified by organisation_id + feature_id + respondant combination

  2. Notes
    - The respondant field is optional (nullable) to maintain backward compatibility
    - Existing responses without a respondant value will still function normally
    - Admin views will display respondant names alongside responses
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'responses' AND column_name = 'respondant'
  ) THEN
    ALTER TABLE responses ADD COLUMN respondant text;
  END IF;
END $$;

-- Create an index for efficient querying by respondant
CREATE INDEX IF NOT EXISTS idx_responses_respondant ON responses(respondant);

-- Create a composite index for the common query pattern
CREATE INDEX IF NOT EXISTS idx_responses_org_feature_respondant ON responses(organisation_id, feature_id, respondant);
