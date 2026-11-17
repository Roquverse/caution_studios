-- Add 'pro' to plan_tier enum so profiles.plan supports ('free', 'plus', 'pro')
ALTER TYPE plan_tier ADD VALUE IF NOT EXISTS 'pro';

