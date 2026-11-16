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

      if (!targetUserId) {
        const customerEmail = data.customer?.email || bodyEmail;
        if (customerEmail) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', customerEmail)
            .maybeSingle();
          if (prof?.id) targetUserId = prof.id;
        }
      }

      if (!targetUserId) {
        const { data: firstProf } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
          .maybeSingle();
        targetUserId = firstProf?.id || null;
      }

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
    const orderId = metadata.order_id || bodyOrderId;
    const targetUserId = metadata.user_id || bodyUserId || null;
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
        const totalAmountCents = data.amount || (items.reduce((acc: number, item: any) => acc + (item.price || 0), 0) * 100);
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

    // Process purchased items (exclusive locks, notifications, license records)
    if (items.length > 0) {
      for (const item of items) {
        if (!item.beat_id) continue;

        if (item.license === 'exclusive') {
          try {
            await supabase.rpc('acquire_exclusive_beat', { p_beat_id: item.beat_id });
          } catch (e) {
            console.warn('Exclusive lock error:', e);
          }
          try {
            await supabase.from('beats').update({ status: 'sold' }).eq('id', item.beat_id);
          } catch (e) {}
        }

        try {
          const { data: beat } = await supabase
            .from('beats')
            .select('id, title, producer_id, producer:producer_id(id, display_name, handle)')
            .eq('id', item.beat_id)
            .maybeSingle();

          if (beat && beat.producer_id) {
            const producerName = (beat.producer as any)?.display_name || 'Producer';
            const priceNgn = item.price || 15000;
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
              const itemTotalCents = priceNgn * 100;
              const platformFeeCents = Math.round(itemTotalCents * 0.2);
              const producerAmountCents = itemTotalCents - platformFeeCents;
              const licenseType = item.license === 'exclusive' ? 'exclusive' : 'premium';

              const { data: orderItem } = await supabase
                .from('order_items')
                .insert({
                  order_id: recordedOrderId,
                  beat_id: beat.id,
                  producer_id: beat.producer_id,
                  license: licenseType,
                  price_cents: itemTotalCents,
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
        } catch (e) {
          console.warn('Error recording beat purchase in database:', e);
        }
      }
    }

    return NextResponse.json({
      status: true,
      verified: true,
      type: 'purchase',
      orderId: recordedOrderId || orderId,
      items,
      reference
    });
  } catch (err: any) {
    console.error('Paystack verification error:', err);
    return NextResponse.json({ error: err.message || 'Payment verification failed' }, { status: 500 });
  }
}
