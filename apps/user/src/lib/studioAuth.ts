import { NextRequest } from 'next/server';
import { getServiceRoleClient } from './supabaseClient';

export type StudioPlan = 'free' | 'plus' | 'pro';

export function resolveStudioPlan(profile: any, meta: any): StudioPlan {
  if (profile?.plan === 'pro' || profile?.stripe_customer_id === 'plan:pro' || meta?.plan === 'pro') return 'pro';
  if (profile?.plan === 'plus' || profile?.stripe_customer_id === 'plan:plus' || meta?.plan === 'plus') return 'plus';
  return 'free';
}

/**
 * Server-side: verify the bearer access token and resolve the caller's plan.
 * Returns null if unauthenticated.
 */
export async function authenticateStudioRequest(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  if (!token) return null;

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, stripe_customer_id')
    .eq('id', data.user.id)
    .maybeSingle();

  return { supabase, user: data.user, plan: resolveStudioPlan(profile, data.user.user_metadata) };
}

