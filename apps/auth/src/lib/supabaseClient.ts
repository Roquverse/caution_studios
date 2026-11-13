import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yvsoqighrijqqnojelgp.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2c29xaWdocmlqcXFub2plbGdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMjcxMzYsImV4cCI6MjEwNjYwMzEzNn0.eBZi2DiW5BKP2Fi_-uFnJkKuCvFOHXfzY91tPbqfuZ0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getServiceRoleClient() {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2c29xaWdocmlqcXFub2plbGdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTAyNzEzNiwiZXhwIjoyMTA2NjAzMTM2fQ.Bf87-IMJjFv0Uy-bh2PUS5c9t0HGmAFJf133Rcy9ZJg';
  return createClient(supabaseUrl, serviceKey);
}
