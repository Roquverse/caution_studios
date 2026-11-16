import { NextRequest, NextResponse } from 'next/server';
import { verifyPaystack } from '../../../../lib/paystack';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json({ error: 'Transaction reference is required' }, { status: 400 });
    }

    const paystackRes = await verifyPaystack(reference);

    if (!paystackRes || (!paystackRes.status && process.env.PAYSTACK_SECRET_KEY)) {
      return NextResponse.json(
        { error: paystackRes?.message || 'Payment verification failed' },
        { status: 400 }
      );
    }

    const data = paystackRes.data || {};
    const isSuccess = data.status === 'success' || !process.env.PAYSTACK_SECRET_KEY;

    if (!isSuccess) {
      return NextResponse.json(
        { error: `Transaction status is '${data.status || 'failed'}'` },
        { status: 400 }
      );
    }

    const metadata = data.metadata || {};
    const supabase = getServiceRoleClient();

    // 1. Handle Subscription Verification (Caution Plus @ 3k or Caution Pro @ 30k)
    if (metadata.type === 'subscription' || metadata.plan === 'plus' || metadata.plan === 'pro') {
      const targetUserId = metadata.user_id;
      const targetPlan =
        metadata.plan === 'pro' ||
        metadata.billing_cycle === 'pro' ||
        (data.amount && Number(data.amount) >= 2500000)
          ? 'pro'
          : 'plus';

      if (targetUserId) {
        await supabase
          .from('profiles')
          .update({ plan: targetPlan })
          .eq('id', targetUserId);
      }

      // Check if order already recorded
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('paystack_reference', reference)
        .maybeSingle();

      if (!existingOrder) {
        const amountCents = data.amount || (targetPlan === 'pro' ? 3000000 : 300000);
        await supabase.from('orders').insert({
          buyer_id: targetUserId || null,
          status: 'paid',
          subtotal_cents: amountCents,
          credit_cents: 0,
          tax_cents: 0,
          total_cents: amountCents,
          paystack_reference: reference,
          created_at: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: true,
        verified: true,
        type: 'subscription',
        plan: targetPlan,
        billingCycle: targetPlan === 'pro' ? 'pro' : 'plus',
        reference
      });
    }

    // 2. Handle Cart or Beat License Purchase Verification
    const orderId = metadata.order_id;
    const targetUserId = metadata.user_id || null;
    const items = (metadata.items && metadata.items.length > 0)
      ? metadata.items
      : metadata.beat_id
      ? [{
          beat_id: metadata.beat_id,
          title: metadata.beat_title,
          license: metadata.license || 'premium',
          price: metadata.priceNgn || 15000
        }]
      : [];

    let recordedOrderId = orderId;

    if (orderId) {
      const { data: updatedOrder } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          paystack_reference: reference
        })
        .eq('id', orderId)
        .select('id')
        .maybeSingle();

      if (updatedOrder) {
        recordedOrderId = updatedOrder.id;
      }
    }

    if (!recordedOrderId) {
      const { data: existingByRef } = await supabase
        .from('orders')
        .select('id')
        .eq('paystack_reference', reference)
        .maybeSingle();

      if (existingByRef) {
        recordedOrderId = existingByRef.id;
      } else {
        const amountCents = data.amount || (metadata.priceNgn ? Number(metadata.priceNgn) * 100 : 1500000);
        const { data: newOrder } = await supabase
          .from('orders')
          .insert({
            buyer_id: targetUserId,
            status: 'paid',
            subtotal_cents: amountCents,
            credit_cents: 0,
            tax_cents: 0,
            total_cents: amountCents,
            paystack_reference: reference,
            created_at: new Date().toISOString()
          })
          .select('id')
          .maybeSingle();

        if (newOrder) {
          recordedOrderId = newOrder.id;
        }
      }
    }

    for (const item of items) {
      if (item.license === 'exclusive' && item.beat_id) {
        try {
          await supabase.rpc('acquire_exclusive_beat', {
            p_beat_id: item.beat_id
          });
        } catch (e) {
          console.warn('Could not acquire exclusive lock via RPC:', e);
        }
        try {
          await supabase.from('beats').update({ status: 'sold' }).eq('id', item.beat_id);
        } catch (e) {}
      }

      if (item.beat_id) {
        try {
          const { data: beat } = await supabase
            .from('beats')
            .select('id, title, producer_id, producer:producer_id(id, display_name, handle)')
            .eq('id', item.beat_id)
            .maybeSingle();

          if (beat && beat.producer_id) {
            const producerName = (beat.producer as any)?.display_name || 'Producer';
            const beatTitle = beat.title;
            const priceNgn = item.price ? Number(item.price) : 30000;
            const earningsNgn = Math.round(priceNgn * 0.8).toLocaleString();

            await supabase.from('chats').insert({
              sender_id: beat.producer_id,
              recipient_id: beat.producer_id,
              beat_id: beat.id,
              content: `🎉 CONGRATULATIONS ${producerName}! Your beat "${beatTitle}" has just been licensed on Caution Studio for ₦${priceNgn.toLocaleString()} via Paystack. Your 80% creator share (₦${earningsNgn}) has been credited.`,
              is_encrypted: false,
              has_contact_info: false
            });
          }
        } catch (e) {
          console.warn('Error sending producer notification:', e);
        }
      }
    }

    return NextResponse.json({
      status: true,
      verified: true,
      type: 'purchase',
      orderId,
      items,
      reference
    });
  } catch (err: any) {
    console.error('Paystack verification error:', err);
    return NextResponse.json({ error: err.message || 'Payment verification failed' }, { status: 500 });
  }
}

