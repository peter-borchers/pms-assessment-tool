/*
  # Allow public organisation creation

  1. Changes
    - Drop existing restrictive policy for organisations
    - Add new policies allowing public users to:
      - Create organisations (INSERT)
      - Read all organisations (SELECT)
      - Update organisations (UPDATE)
      - Delete organisations (DELETE)
  
  2. Security Notes
    - This allows unauthenticated access for admin operations
    - Consider adding authentication in the future for production use
*/

DROP POLICY IF EXISTS "Authenticated users can manage organisations" ON organisations;
DROP POLICY IF EXISTS "Anyone can read organisations by code" ON organisations;

CREATE POLICY "Anyone can create organisations"
  ON organisations
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read organisations"
  ON organisations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can update organisations"
  ON organisations
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete organisations"
  ON organisations
  FOR DELETE
  TO public
  USING (true);