import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    const secret = process.env.PAYSTACK_SECRET_KEY;

    // Fail-secure: If in production or live key exists, signature is strictly required
    const isProd = process.env.NODE_ENV === 'production';
    if (secret) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing x-paystack-signature header' }, { status: 401 });
      }

      const hash = crypto
        .createHmac('sha512', secret)
        .update(rawBody)
        .digest('hex');

      const hashBuffer = Buffer.from(hash, 'hex');
      const signatureBuffer = Buffer.from(signature, 'hex');

      // Use constant-time comparison to prevent timing attacks
      if (
        hashBuffer.length !== signatureBuffer.length ||
        !crypto.timingSafeEqual(hashBuffer, signatureBuffer)
      ) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    } else if (isProd) {
      // In production without a secret key configured, reject webhook
      return NextResponse.json(
        { error: 'PAYSTACK_SECRET_KEY not configured on server' },
        { status: 500 }
      );
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success' && data) {
      const reference = data.reference;
      const metadata = data.metadata || {};
      const orderId = metadata.order_id;
      const items = metadata.items || [];

      const supabase = getServiceRoleClient();

      // Check order
      if (orderId) {
        await supabase
          .from('orders')
          .update({
            status: 'paid',
            paystack_reference: reference
          })
          .eq('id', orderId);
      }

      // Atomic lock for any exclusive items
      for (const item of items) {
        if (item.license === 'exclusive' && item.beat_id) {
          await supabase.rpc('acquire_exclusive_beat', {
            p_beat_id: item.beat_id
          });
        }
      }

      return NextResponse.json({ success: true, reference, orderId });
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Paystack webhook error:', err);
    return NextResponse.json({ error: 'Internal server error processing webhook' }, { status: 500 });
  }
}
