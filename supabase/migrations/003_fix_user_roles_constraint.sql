-- Migration: 003_fix_user_roles_constraint.sql
-- Fixes the user_roles check constraint to include nurse, technician, and admin

ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('doctor', 'nurse', 'technician', 'clinic', 'admin'));
