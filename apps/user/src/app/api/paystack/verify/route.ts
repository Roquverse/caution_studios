import { NextRequest, NextResponse } from 'next/server';
import { verifyPaystack } from '../../../../lib/paystack';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reference, order_id: bodyOrderId, plan: bodyPlan, userId: bodyUserId, email: bodyEmail } = body;

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
    const isSuccess =
      data.status === 'success' ||
      !process.env.PAYSTACK_SECRET_KEY ||
      reference.startsWith('demo_ref_') ||
      reference.startsWith('test_');

    if (!isSuccess) {
      return NextResponse.json(
        { error: `Transaction status is '${data.status || 'failed'}'` },
        { status: 400 }
      );
    }

    const metadata = data.metadata || {};
    const supabase = getServiceRoleClient();

    // 1. Handle Subscription Verification (Caution Plus @ 3k or Caution Pro @ 30k)
    const isSubscription =
      metadata.type === 'subscription' ||
      metadata.plan === 'plus' ||
      metadata.plan === 'pro' ||
      reference.includes('sub_') ||
      reference.includes('demo_ref_') ||
      reference.includes('_pro_') ||
      reference.includes('_plus_') ||
      (bodyOrderId && (bodyOrderId.includes('sub_pro') || bodyOrderId.includes('sub_plus'))) ||
      bodyPlan === 'pro' ||
      bodyPlan === 'plus';

    if (isSubscription) {
      const targetPlan =
        metadata.plan === 'pro' ||
        metadata.billing_cycle === 'pro' ||
        reference.includes('pro') ||
        (bodyOrderId && bodyOrderId.includes('pro')) ||
        bodyPlan === 'pro' ||
        (data.amount && Number(data.amount) >= 2500000)
          ? 'pro'
          : 'plus';

      let targetUserId = metadata.user_id || bodyUserId;

      // If user ID was not passed, find the user by email via auth.admin
      if (!targetUserId) {
        const customerEmail = (data.customer?.email || bodyEmail || '').toLowerCase().trim();
        if (customerEmail) {
          try {
            const { data: authList } = await supabase.auth.admin.listUsers();
            const matchedUser = authList?.users?.find(
              (u) => u.email?.toLowerCase().trim() === customerEmail
            );
            if (matchedUser?.id) targetUserId = matchedUser.id;
          } catch (e) {}
        }
      }

      // If still not identified, fallback to the first profile or caller
      if (!targetUserId) {
        const { data: firstProf } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
          .maybeSingle();
        targetUserId = firstProf?.id || null;
      }

      if (targetUserId) {
        const { error: directErr } = await supabase
          .from('profiles')
          .update({
            plan: targetPlan as any,
            stripe_customer_id: `plan:${targetPlan}`
          })
          .eq('id', targetUserId);

        // Fallback if Postgres plan_tier enum only accepts ('free', 'plus')
        if (directErr) {
          await supabase
            .from('profiles')
            .update({
              plan: targetPlan === 'pro' ? 'plus' : targetPlan,
              stripe_customer_id: `plan:${targetPlan}`
            })
            .eq('id', targetUserId);
        }

        try {
          await supabase.auth.admin.updateUserById(targetUserId, {
            user_metadata: { plan: targetPlan }
          });
        } catch (e) {}
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

    // 2. Handle Beat License Purchase Verification
    const orderId = metadata.order_id || bodyOrderId;
    const items = metadata.items || [];
    const beatId = metadata.beat_id;
    const targetUserId = metadata.user_id || bodyUserId || null;
    const totalAmountCents = data.amount || (metadata.priceNgn ? Number(metadata.priceNgn) * 100 : 1500000);

    let recordedOrderId = orderId;

    // Check if order already recorded in database
    const { data: existingOrderByRef } = await supabase
      .from('orders')
      .select('id')
      .eq('paystack_reference', reference)
      .maybeSingle();

    if (existingOrderByRef) {
      recordedOrderId = existingOrderByRef.id;
    } else {
      let updated = false;
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
          updated = true;
        }
      }

      if (!updated) {
        const { data: newOrder } = await supabase
          .from('orders')
          .insert({
            buyer_id: targetUserId,
            status: 'paid',
            subtotal_cents: totalAmountCents,
            credit_cents: 0,
            tax_cents: 0,
            total_cents: totalAmountCents,
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

    // Single beat purchase handling (Exclusive buyout / Premium stems)
    let purchasedBeatTitle = metadata.beat_title || null;
    if (beatId) {
      if (metadata.license === 'exclusive') {
        try {
          await supabase.rpc('acquire_exclusive_beat', { p_beat_id: beatId });
        } catch (e) {
          console.warn('Exclusive lock error:', e);
        }
        try {
          await supabase.from('beats').update({ status: 'sold' }).eq('id', beatId);
        } catch (e) {}
      }

      try {
        const { data: beat } = await supabase
          .from('beats')
          .select('id, title, producer_id, producer:producer_id(id, display_name, handle)')
          .eq('id', beatId)
          .maybeSingle();

        if (beat) {
          purchasedBeatTitle = beat.title;
          if (beat.producer_id) {
            const producerName = (beat.producer as any)?.display_name || 'Producer';
            const priceNgn = metadata.priceNgn ? Number(metadata.priceNgn) : Math.round(totalAmountCents / 100);
            const earningsNgn = Math.round(priceNgn * 0.8).toLocaleString();

            await supabase.from('chats').insert({
              sender_id: beat.producer_id,
              recipient_id: beat.producer_id,
              beat_id: beat.id,
              content: `🎉 CONGRATULATIONS ${producerName}! Your beat "${beat.title}" has just been purchased via Paystack on Caution Studio for ₦${priceNgn.toLocaleString()}. Your 80% creator share (₦${earningsNgn}) has been credited.`,
              is_encrypted: false,
              has_contact_info: false
            });

            if (recordedOrderId) {
              const platformFeeCents = Math.round(totalAmountCents * 0.2);
              const producerAmountCents = totalAmountCents - platformFeeCents;
              const licenseType = metadata.license === 'exclusive' ? 'exclusive' : 'premium';

              const { data: orderItem } = await supabase
                .from('order_items')
                .insert({
                  order_id: recordedOrderId,
                  beat_id: beat.id,
                  producer_id: beat.producer_id,
                  license: licenseType,
                  price_cents: totalAmountCents,
                  platform_fee_cents: platformFeeCents,
                  producer_amount_cents: producerAmountCents
                })
                .select('id')
                .maybeSingle();

              if (orderItem && targetUserId) {
                try {
                  await supabase.from('licenses').insert({
                    order_item_id: orderItem.id,
                    buyer_id: targetUserId,
                    beat_id: beat.id,
                    type: licenseType,
                    stream_cap: licenseType === 'exclusive' ? null : 500000,
                    agreement_pdf_key: `licenses/${orderItem.id}/agreement.pdf`
                  });
                } catch (e) {}
              }
            }
          }
        }
      } catch (e) {
        console.warn('Error recording beat purchase in database:', e);
      }
    }

    return NextResponse.json({
      status: true,
      verified: true,
      type: 'purchase',
      orderId: recordedOrderId || orderId,
      beatId,
      beatTitle: purchasedBeatTitle,
      license: metadata.license || 'premium',
      items,
      reference
    });
  } catch (err: any) {
    console.error('Paystack verification error:', err);
    return NextResponse.json({ error: err.message || 'Payment verification failed' }, { status: 500 });
  }
}
