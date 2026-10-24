import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { beatId, tier = 'premium', buyerEmail, buyerName } = body;

    if (!beatId) {
      return NextResponse.json({ error: 'beatId is required' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // 1. Fetch beat & producer details
    const { data: beat, error: beatErr } = await supabase
      .from('beats')
      .select(`
        *,
        producer:producer_id (
          id,
          display_name,
          handle,
          notify_sales
        )
      `)
      .eq('id', beatId)
      .maybeSingle();

    if (beatErr || !beat) {
      return NextResponse.json({ error: 'Beat not found' }, { status: 404 });
    }

    // 2. Determine price and 80/20 split
    let priceNgn = 30000;
    if (tier === 'basic') priceNgn = 3000;
    else if (tier === 'exclusive') priceNgn = 100000;

    const priceCents = priceNgn * 100;
    const platformFeeCents = Math.round(priceCents * 0.2); // 20%
    const producerAmountCents = Math.round(priceCents * 0.8); // 80%

    const producerId = beat.producer_id;

    // 3. Resolve buyer profile
    let buyerId = beat.producer_id; // fallback
    if (buyerEmail) {
      const { data: buyerProf } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', buyerEmail)
        .maybeSingle();
      if (buyerProf) buyerId = buyerProf.id;
    }

    // 4. Create Order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        buyer_id: buyerId,
        status: 'paid',
        subtotal_cents: priceCents,
        total_cents: priceCents,
        paystack_reference: `cs_lic_${Date.now()}`
      })
      .select()
      .single();

    if (order) {
      // 5. Create Order Item
      await supabase.from('order_items').insert({
        order_id: order.id,
        beat_id: beat.id,
        producer_id: producerId,
        license: tier,
        price_cents: priceCents,
        platform_fee_cents: platformFeeCents,
        producer_amount_cents: producerAmountCents
      });

      // 6. Create License Record
      const licenseNumber = `CS-${tier.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`;
      await supabase.from('licenses').insert({
        order_id: order.id,
        beat_id: beat.id,
        buyer_id: buyerId,
        producer_id: producerId,
        license_type: tier,
        license_number: licenseNumber,
        price_cents: priceCents,
        producer_amount_cents: producerAmountCents,
        status: 'active'
      });

      // 7. If exclusive, lock beat
      if (tier === 'exclusive') {
        await supabase
          .from('beats')
          .update({ status: 'sold', sold_at: new Date().toISOString() })
          .eq('id', beat.id);
      }
    }

    // 8. Send Congratulations Notification to Producer
    const producerName = beat.producer?.display_name || 'Caution Producer';
    const beatTitle = beat.title;
    const tierName = tier === 'basic' ? 'Basic MP3 Lease' : tier === 'exclusive' ? 'Exclusive 1-of-1 Buyout' : 'Premium WAV + Stems';
    const earningsNgn = (producerAmountCents / 100).toLocaleString();

    console.log(`[PRODUCER SALE NOTIFICATION] Sending congratulations alert to producer ${producerId} (${producerName}):`);
    console.log(`🎉 Congratulations ${producerName}! Your beat "${beatTitle}" was just licensed (${tierName}) for ₦${priceNgn.toLocaleString()}! You earned ₦${earningsNgn} (80% split).`);

    // In-app studio chat / notification record
    await supabase.from('chats').insert({
      sender_id: buyerId,
      recipient_id: producerId,
      beat_id: beat.id,
      content: `🎉 CONGRATULATIONS! Your beat "${beatTitle}" has just been licensed (${tierName}) by an artist on Caution Studio Beat Store for ₦${priceNgn.toLocaleString()}. Your 80% creator share (₦${earningsNgn}) has been credited to your royalty balance.`,
      is_encrypted: false,
      has_contact_info: false
    });

    return NextResponse.json({
      success: true,
      licenseNumber: `CS-${tier.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`,
      beatTitle,
      tier,
      priceNgn,
      producerAmountCents,
      congratulationsSent: true
    });
  } catch (err: any) {
    console.error('Error licensing beat:', err);
    return NextResponse.json({ error: err.message || 'Failed to process license' }, { status: 500 });
  }
}
