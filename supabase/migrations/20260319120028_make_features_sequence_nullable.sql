/*
  # Make features sequence column nullable

  1. Changes
    - Alter the `features` table to make the `sequence` column nullable
    - This allows importing features without explicit sequence numbers
*/

ALTER TABLE features 
ALTER COLUMN sequence DROP NOT NULL;
