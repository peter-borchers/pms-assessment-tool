/*
  # Add User Feature Notes Table

  1. New Tables
    - `user_feature_notes`
      - `id` (uuid, primary key) - Unique identifier for each note
      - `organisation_id` (uuid, foreign key) - Links to organisations table
      - `category` (text) - The category name (e.g., "Core HR")
      - `subcategory` (text) - The subcategory name (e.g., "Employee Management")
      - `notes` (text) - The actual notes content
      - `created_at` (timestamptz) - When the note was created
      - `updated_at` (timestamptz) - When the note was last updated

  2. Security
    - Enable RLS on `user_feature_notes` table
    - Add policy for public to read all notes
    - Add policy for public to insert new notes
    - Add policy for public to update existing notes
    - Add policy for public to delete notes

  3. Indexes
    - Add unique index on (organisation_id, category, subcategory) to ensure one note per org/category/subcategory combination
    - Add index on organisation_id for faster lookups
*/

CREATE TABLE IF NOT EXISTS user_feature_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  category text NOT NULL,
  subcategory text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_org_category_subcategory UNIQUE (organisation_id, category, subcategory)
);

ALTER TABLE user_feature_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to read all notes"
  ON user_feature_notes
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public to insert notes"
  ON user_feature_notes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public to update notes"
  ON user_feature_notes
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete notes"
  ON user_feature_notes
  FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_user_feature_notes_org_id ON user_feature_notes(organisation_id);
CREATE INDEX IF NOT EXISTS idx_user_feature_notes_lookup ON user_feature_notes(organisation_id, category, subcategory);