/*
  # Add is_active Column to Features Table

  1. Changes
    - Add `is_active` column to `features` table
      - `is_active` (boolean, default true) - Determines if feature is shown to customers
    - Create index on is_active for query performance
  
  2. Notes
    - All existing features will default to active (true)
    - Inactive features will not be displayed on customer-facing pages
    - Admins can toggle this flag to hide/show features without deleting them
*/

-- Add is_active column to features table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'features' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE features ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Create index for better query performance when filtering by active status
CREATE INDEX IF NOT EXISTS idx_features_is_active ON features(is_active);