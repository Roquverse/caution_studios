import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yvsoqighrijqqnojelgp.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2c29xaWdocmlqcXFub2plbGdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMjcxMzYsImV4cCI6MjEwNjYwMzEzNn0.eBZi2DiW5BKP2Fi_-uFnJkKuCvFOHXfzY91tPbqfuZ0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
