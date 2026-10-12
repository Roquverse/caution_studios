import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

// GET /api/billing - Returns real billing invoices & orders for the current user
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const searchParams = req.nextUrl.searchParams;
    let userId = searchParams.get('userId');

    // If no userId provided, find the primary profile
    if (!userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle();
      userId = profile?.id || null;
    }

    if (!userId) {
      return NextResponse.json({ orders: [], profile: null });
    }

    // Fetch user profile plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    // Fetch orders from database
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          beat:beat_id(id, title, cover_url, genre)
        )
      `)
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching billing orders:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedInvoices = (orders || []).map((o, idx) => {
      const invoiceRef = o.paystack_reference || `CS-INV-${new Date(o.created_at).getFullYear()}-${String(100 - idx).padStart(4, '0')}`;
      const amountNgn = o.total_cents ? o.total_cents / 100 : 0;
      const dateFormatted = new Date(o.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      });

      return {
        id: o.id,
        invoiceNumber: invoiceRef,
        date: dateFormatted,
        rawDate: o.created_at,
        amountNgn,
        formattedAmount: `₦${amountNgn.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        status: (o.status || 'paid').toUpperCase(),
        items: o.items || [],
        pdfUrl: `/api/billing/receipt?id=${o.id}`
      };
    });

    return NextResponse.json({
      profile,
      invoices: formattedInvoices
    });
  } catch (err: any) {
    console.error('Billing GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/billing - Upgrade plan or record a subscription payment in database
export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await req.json();
    const { userId, plan, billingCycle = 'monthly' } = body;

    let targetUserId = userId;
    if (!targetUserId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle();
      targetUserId = profile?.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // 1. Update Profile Plan in database
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ plan })
      .eq('id', targetUserId);

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    // 2. If upgrading to Plus, insert real invoice record into orders table
    let newOrder = null;
    if (plan === 'plus') {
      const isYearly = billingCycle === 'yearly';
      const amountCents = isYearly ? 3000000 : 300000; // ₦30,000 or ₦3,000 in kobo
      const now = new Date();
      const invoiceRef = `CS-INV-${now.getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

      const { data: createdOrder, error: orderErr } = await supabase
        .from('orders')
        .insert({
          buyer_id: targetUserId,
          status: 'paid',
          subtotal_cents: amountCents,
          credit_cents: 0,
          tax_cents: 0,
          total_cents: amountCents,
          paystack_reference: invoiceRef,
          created_at: now.toISOString()
        })
        .select()
        .single();

      if (orderErr) {
        console.warn('Could not record order invoice in database:', orderErr);
      } else {
        newOrder = createdOrder;
      }
    }

    return NextResponse.json({
      success: true,
      plan,
      order: newOrder
    });
  } catch (err: any) {
    console.error('Billing POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
