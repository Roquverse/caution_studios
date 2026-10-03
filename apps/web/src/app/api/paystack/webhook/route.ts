import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    const secret = process.env.PAYSTACK_SECRET_KEY;

    // Verify HMAC SHA512 signature if secret key is present
    if (secret && signature) {
      const hash = crypto
        .createHmac('sha512', secret)
        .update(rawBody)
        .digest('hex');

      if (hash !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success') {
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
        if (item.license === 'exclusive') {
          await supabase.rpc('acquire_exclusive_beat', {
            p_beat_id: item.beat_id
          });
        }
      }

      return NextResponse.json({ success: true, reference, orderId });
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
