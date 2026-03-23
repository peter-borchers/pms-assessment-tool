/*
  # Update Features Table RLS Policies

  1. Changes
    - Drop existing restrictive policies on features table
    - Add new policies allowing public write access for imports
    
  2. Security
    - Allow anyone to insert/delete features (needed for CSV import)
    - Maintain public read access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can manage features" ON features;

-- Create new policies with public write access
CREATE POLICY "Anyone can insert features"
  ON features FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update features"
  ON features FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete features"
  ON features FOR DELETE
  USING (true);
