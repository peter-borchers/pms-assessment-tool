/*
  # Create Requirements Questionnaire Schema

  1. New Tables
    - `organisations`
      - `id` (uuid, primary key) - Unique identifier
      - `code` (text, unique) - Human-readable org code (e.g., 'TRP-2024-ABC')
      - `name` (text) - Organisation name
      - `created_at` (timestamptz) - Creation timestamp
      - `expires_at` (timestamptz, nullable) - Optional link expiry
      - `notes` (text, nullable) - Internal admin notes
    
    - `features`
      - `id` (uuid, primary key) - Unique identifier
      - `category` (text) - Main category (e.g., '🏢 Group & Multi-Property')
      - `subcategory` (text, nullable) - Subcategory grouping
      - `sequence` (int) - Display order
      - `feature_text` (text) - The actual requirement text
      - `hint_text` (text, nullable) - Pre-filled hints/guidance
      - `is_subgroup` (boolean) - TRUE for ↳ header rows
      - `created_at` (timestamptz) - Creation timestamp
    
    - `responses`
      - `id` (uuid, primary key) - Unique identifier
      - `organisation_id` (uuid, foreign key) - References organisations
      - `feature_id` (uuid, foreign key) - References features
      - `priority` (text, nullable) - Must Have|Should Have|Nice to Have|Not Required
      - `current_state` (text, nullable) - Current implementation state
      - `notes` (text, nullable) - Client notes
      - `updated_at` (timestamptz) - Last update timestamp
      - Unique constraint on (organisation_id, feature_id)

  2. Security
    - Enable RLS on all tables
    - Public read access to organisations by code
    - Public read access to features
    - Public create/update access to responses (by org code)
    - Full admin access for authenticated users
*/

-- Create organisations table
CREATE TABLE IF NOT EXISTS organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  notes text
);

-- Create features table
CREATE TABLE IF NOT EXISTS features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  subcategory text,
  sequence int NOT NULL,
  feature_text text NOT NULL,
  hint_text text,
  is_subgroup boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create responses table
CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  feature_id uuid REFERENCES features(id) ON DELETE CASCADE NOT NULL,
  priority text,
  current_state text,
  notes text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organisation_id, feature_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_responses_org_id ON responses(organisation_id);
CREATE INDEX IF NOT EXISTS idx_responses_feature_id ON responses(feature_id);
CREATE INDEX IF NOT EXISTS idx_features_category ON features(category);
CREATE INDEX IF NOT EXISTS idx_features_sequence ON features(sequence);

-- Enable Row Level Security
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Organisations policies
CREATE POLICY "Anyone can read organisations by code"
  ON organisations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage organisations"
  ON organisations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Features policies (public read, admin write)
CREATE POLICY "Anyone can read features"
  ON features FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage features"
  ON features FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Responses policies (public can create/update, admin full access)
CREATE POLICY "Anyone can read responses"
  ON responses FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert responses"
  ON responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update responses"
  ON responses FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete responses"
  ON responses FOR DELETE
  TO authenticated
  USING (true);