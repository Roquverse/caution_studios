import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    const secret =
      process.env.PAYSTACK_WEBHOOK_SECRET ||
      process.env.PAYSTACK_SECRET_KEY;

    // Signature verification (supports both Webhook Signing Secret whsec_... and Secret Key sk_...)
    if (secret && signature) {
      const hash = crypto
        .createHmac('sha512', secret)
        .update(rawBody)
        .digest('hex');

      const hashBuffer = Buffer.from(hash, 'hex');
      const signatureBuffer = Buffer.from(signature, 'hex');

      if (
        hashBuffer.length !== signatureBuffer.length ||
        !crypto.timingSafeEqual(hashBuffer, signatureBuffer)
      ) {
        // Fallback: Check if PAYSTACK_SECRET_KEY was used if PAYSTACK_WEBHOOK_SECRET is different
        const altSecret = process.env.PAYSTACK_SECRET_KEY;
        let altValid = false;
        if (altSecret && altSecret !== secret) {
          const altHash = crypto.createHmac('sha512', altSecret).update(rawBody).digest('hex');
          const altHashBuf = Buffer.from(altHash, 'hex');
          if (altHashBuf.length === signatureBuffer.length && crypto.timingSafeEqual(altHashBuf, signatureBuffer)) {
            altValid = true;
          }
        }

        if (!altValid) {
          return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
        }
      }
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
      const amount = Number(data.amount) || 0;
      const customerEmail = (data.customer?.email || metadata.email || '').toLowerCase().trim();

      const supabase = getServiceRoleClient();

      // Check if this is a subscription transaction
      const isSubscription =
        metadata.type === 'subscription' ||
        metadata.plan === 'plus' ||
        metadata.plan === 'pro' ||
        reference.includes('sub_') ||
        (orderId && orderId.includes('sub_')) ||
        amount === 300000 || // ₦3,000
        amount === 1000000 || // ₦10,000
        amount === 3000000; // ₦30,000

      if (isSubscription) {
        const targetPlan =
          metadata.plan === 'pro' ||
          metadata.billing_cycle === 'pro' ||
          reference.includes('pro') ||
          (orderId && orderId.includes('pro')) ||
          amount >= 1000000
            ? 'pro'
            : 'plus';

        let targetUserId = metadata.user_id || metadata.userId;

        // Find user by customerEmail if user_id is not in metadata
        if (!targetUserId && customerEmail) {
          try {
            const { data: matchedProfile } = await supabase
              .from('profiles')
              .select('id')
              .ilike('email', customerEmail)
              .maybeSingle();

            if (matchedProfile?.id) {
              targetUserId = matchedProfile.id;
            } else {
              // Look through auth.users
              let page = 1;
              let hasMore = true;
              while (hasMore && !targetUserId) {
                const { data: authList, error: authErr } = await supabase.auth.admin.listUsers({
                  page,
                  perPage: 100
                });
                if (authErr || !authList?.users || authList.users.length === 0) {
                  hasMore = false;
                  break;
                }
                const matchedUser = authList.users.find(
                  (u) => u.email?.toLowerCase().trim() === customerEmail
                );
                if (matchedUser?.id) {
                  targetUserId = matchedUser.id;
                  break;
                }
                if (authList.users.length < 100) hasMore = false;
                else page++;
              }
            }
          } catch (e) {
            console.warn('Error matching customer by email in user webhook:', e);
          }
        }

        if (targetUserId) {
          const periodResetsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          const { error: directErr } = await supabase
            .from('profiles')
            .update({
              plan: targetPlan as any,
              stripe_customer_id: `plan:${targetPlan}`,
              period_resets_at: periodResetsAt
            })
            .eq('id', targetUserId);

          if (directErr) {
            await supabase
              .from('profiles')
              .update({
                plan: targetPlan === 'pro' ? 'plus' : targetPlan,
                stripe_customer_id: `plan:${targetPlan}`,
                period_resets_at: periodResetsAt
              })
              .eq('id', targetUserId);
          }

          try {
            await supabase.auth.admin.updateUserById(targetUserId, {
              user_metadata: { plan: targetPlan, period_resets_at: periodResetsAt }
            });
          } catch (e) {}

          // Record or update order
          const { data: existingOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('paystack_reference', reference)
            .maybeSingle();

          if (!existingOrder) {
            await supabase.from('orders').insert({
              buyer_id: targetUserId,
              status: 'paid',
              subtotal_cents: amount,
              credit_cents: 0,
              tax_cents: 0,
              total_cents: amount,
              paystack_reference: reference,
              created_at: new Date().toISOString()
            });
          }
        } else {
          console.warn('Webhook received subscription payment but could not match user:', {
            customerEmail,
            reference,
            amount
          });
        }
      }

      return NextResponse.json({ success: true, reference });
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Paystack user webhook error:', err);
    return NextResponse.json({ error: 'Internal server error processing webhook' }, { status: 500 });
  }
}
