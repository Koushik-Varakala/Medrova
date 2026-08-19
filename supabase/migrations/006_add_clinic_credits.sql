-- Migration: 006_add_clinic_credits.sql
-- Add credits column to clinics for the new SaaS model

ALTER TABLE clinics 
ADD COLUMN credits INT NOT NULL DEFAULT 5;
