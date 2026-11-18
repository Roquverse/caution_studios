import { NextRequest, NextResponse } from 'next/server';
import { authenticateStudioRequest as authenticate } from '../../../../lib/studioAuth';

export const dynamic = 'force-dynamic';

const PLUS_MONTHLY_STUDIO_SESSIONS = 2;

function currentUsageMonth() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function countUsed(supabase: any, userId: string, month: string) {
  const { count, error } = await supabase
    .from('studio_recording_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('usage_month', month);
  if (error) throw error;
  return count || 0;
}

// GET /api/record-studio/usage — current month studio session usage for the signed-in user
export async function GET(req: NextRequest) {
  try {
    const ctx = await authenticate(req);
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const month = currentUsageMonth();
    if (ctx.plan === 'pro') {
      return NextResponse.json({ plan: 'pro', used: 0, limit: null, remaining: null, month, canSave: true });
    }

    const used = await countUsed(ctx.supabase, ctx.user.id, month);
    const limit = ctx.plan === 'plus' ? PLUS_MONTHLY_STUDIO_SESSIONS : 0;
    return NextResponse.json({
      plan: ctx.plan,
      used,
      limit,
      remaining: Math.max(0, limit - used),
      month,
      canSave: false
    });
  } catch (err: any) {
    console.error('Studio usage GET error:', err);
    return NextResponse.json({ error: err?.message || 'Usage lookup failed' }, { status: 500 });
  }
}

// POST /api/record-studio/usage — consume one recording session (idempotent per sessionKey)
export async function POST(req: NextRequest) {
  try {
    const ctx = await authenticate(req);
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sessionKey } = await req.json().catch(() => ({ sessionKey: '' }));
    if (!sessionKey || typeof sessionKey !== 'string') {
      return NextResponse.json({ error: 'sessionKey is required' }, { status: 400 });
    }

    const month = currentUsageMonth();

    if (ctx.plan === 'pro') {
      return NextResponse.json({ allowed: true, plan: 'pro', used: 0, limit: null, remaining: null });
    }
    if (ctx.plan !== 'plus') {
      return NextResponse.json({ allowed: false, plan: ctx.plan, reason: 'upgrade_required' }, { status: 403 });
    }

    // Already counted this session? Allow without consuming another.
    const { data: existing } = await ctx.supabase
      .from('studio_recording_sessions')
      .select('id')
      .eq('user_id', ctx.user.id)
      .eq('session_key', sessionKey)
      .maybeSingle();

    const used = await countUsed(ctx.supabase, ctx.user.id, month);
    const limit = PLUS_MONTHLY_STUDIO_SESSIONS;

    if (existing) {
      return NextResponse.json({ allowed: true, plan: 'plus', used, limit, remaining: Math.max(0, limit - used) });
    }

    if (used >= limit) {
      return NextResponse.json(
        { allowed: false, plan: 'plus', used, limit, remaining: 0, reason: 'monthly_limit_reached' },
        { status: 403 }
      );
    }

    const { error: insertErr } = await ctx.supabase.from('studio_recording_sessions').insert({
      user_id: ctx.user.id,
      session_key: sessionKey,
      usage_month: month,
      plan: 'plus'
    });
    if (insertErr) throw insertErr;

    const nowUsed = used + 1;
    return NextResponse.json({ allowed: true, plan: 'plus', used: nowUsed, limit, remaining: Math.max(0, limit - nowUsed) });
  } catch (err: any) {
    console.error('Studio usage POST error:', err);
    return NextResponse.json({ error: err?.message || 'Could not register studio session' }, { status: 500 });
  }
}
