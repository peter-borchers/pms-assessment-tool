/*
  # Disable RLS on All Tables

  1. Changes
    - Disable Row Level Security on organisations table
    - Disable Row Level Security on features table
    - Disable Row Level Security on responses table
    - Disable Row Level Security on settings table
    - Disable Row Level Security on user_feature_notes table

  2. Security Note
    - This removes all row-level security restrictions
    - All data will be publicly accessible without authentication checks
*/

ALTER TABLE organisations DISABLE ROW LEVEL SECURITY;
ALTER TABLE features DISABLE ROW LEVEL SECURITY;
ALTER TABLE responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_notes DISABLE ROW LEVEL SECURITY;
