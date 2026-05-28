-- Performance indexes for the profiles table
-- These improve query performance on common filtering and sorting operations.
-- Uses CREATE INDEX IF NOT EXISTS for safe, idempotent migrations.

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles (status);
CREATE INDEX IF NOT EXISTS idx_profiles_village_origin ON profiles (village_origin);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles (created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_certificate_issued ON profiles (certificate_issued);
CREATE INDEX IF NOT EXISTS idx_profiles_is_ambassadeur ON profiles (is_ambassadeur);
