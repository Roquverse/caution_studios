import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') || '';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const signature = req.headers.get('x-paystack-signature');
    const bodyText = await req.text();

    // Verify Paystack HMAC SHA512 signature if secret key is present
    if (PAYSTACK_SECRET_KEY && signature) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(PAYSTACK_SECRET_KEY),
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
      );
      const computedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(bodyText));
      const hashHex = Array.from(new Uint8Array(computedSig))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      if (hashHex !== signature) {
        return new Response('Invalid Signature', { status: 400 });
      }
    }

    const payload = JSON.parse(bodyText);
    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success') {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const reference = data.reference;
      const metadata = data.metadata || {};
      const orderId = metadata.order_id;

      if (!orderId) {
        return new Response(JSON.stringify({ message: 'No order ID attached' }), { status: 200 });
      }

      // Check if order already processed (idempotency)
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (existingOrder && existingOrder.status === 'paid') {
        return new Response(JSON.stringify({ message: 'Order already fulfilled' }), { status: 200 });
      }

      // Fetch order items to issue licenses & execute exclusive locks
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      for (const item of orderItems || []) {
        // Atomic exclusive lock if exclusive license
        if (item.license === 'exclusive') {
          const { data: locked, error: lockErr } = await supabase.rpc('acquire_exclusive_beat', {
            p_beat_id: item.beat_id
          });

          if (!locked) {
            console.error(`Beat ${item.beat_id} was already sold! Line item will require refund.`);
          }
        }

        // Issue license record
        await supabase.from('licenses').insert({
          order_item_id: item.id,
          buyer_id: existingOrder.buyer_id,
          beat_id: item.beat_id,
          type: item.license,
          stream_cap: item.license === 'basic' ? 100000 : item.license === 'premium' ? 500000 : null,
          video_cap: item.license === 'basic' ? 1 : item.license === 'premium' ? 2 : null,
          agreement_pdf_key: `licenses/${existingOrder.buyer_id}/${item.id}.pdf`
        });
      }

      // Mark order as paid
      await supabase
        .from('orders')
        .update({
          status: 'paid',
          paystack_reference: reference
        })
        .eq('id', orderId);

      return new Response(JSON.stringify({ success: true, orderId }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
