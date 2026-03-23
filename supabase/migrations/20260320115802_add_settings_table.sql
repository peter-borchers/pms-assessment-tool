/*
  # Add Settings Table

  1. New Tables
    - `settings`
      - `id` (uuid, primary key) - Unique identifier
      - `key` (text, unique) - Setting key name (e.g., 'CategoriesToHide')
      - `value` (text) - Setting value (comma-separated categories for CategoriesToHide)
      - `description` (text) - Human-readable description of the setting
      - `created_at` (timestamptz) - Timestamp when setting was created
      - `updated_at` (timestamptz) - Timestamp when setting was last updated

  2. Security
    - Enable RLS on `settings` table
    - Add policy for public read access (settings need to be readable by users)
    - Add policy for authenticated admin access to update settings

  3. Initial Data
    - Insert default 'CategoriesToHide' setting with empty value
*/

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (a
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text DEFAULT '',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings (needed for filtering categories)
CREATE POLICY "Anyone can read settings"
  ON settings
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to update settings (admin functionality)
CREATE POLICY "Authenticated users can update settings"
  ON settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to insert settings
CREATE POLICY "Authenticated users can insert settings"
  ON settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default CategoriesToHide setting
INSERT INTO settings (key, value, description)
VALUES (
  'CategoriesToHide',
  '',
  'Comma-separated list of category names to hide from users when completing the features form'
)
ON CONFLICT (key) DO NOTHING;