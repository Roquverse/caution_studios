import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';
import { sendAdminNotification, sendBeatPurchaseDeliveryEmail, PurchasedBeatEmailItem } from '../../../../lib/emailNotifier';
import { getPresignedDownloadUrl } from '../../../../lib/r2Server';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;

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

      // 1. Handle subscription upgrade (Caution Plus or Caution Pro)
      if (metadata.type === 'subscription' || metadata.plan === 'plus' || metadata.plan === 'pro') {
        const targetPlan =
          metadata.plan === 'pro' ||
          metadata.billing_cycle === 'pro' ||
          (data.amount && Number(data.amount) >= 2500000)
            ? 'pro'
            : 'plus';

        let targetUserId = metadata.user_id;
        const customerEmail = (data.customer?.email || metadata.email || '').toLowerCase().trim();

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
              const { data: authList } = await supabase.auth.admin.listUsers({ perPage: 100 });
              const matchedUser = authList?.users?.find(
                (u) => u.email?.toLowerCase().trim() === customerEmail
              );
              if (matchedUser?.id) targetUserId = matchedUser.id;
            }
          } catch (e) {
            console.warn('Error matching customer by email in web webhook:', e);
          }
        }

        if (targetUserId) {
          const { error: directErr } = await supabase
            .from('profiles')
            .update({
              plan: targetPlan as any,
              stripe_customer_id: `plan:${targetPlan}`
            })
            .eq('id', targetUserId);

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
      }

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

      // Atomic lock for any exclusive items and dispatch congratulations notifications to producers
      const emailDeliveryItems: PurchasedBeatEmailItem[] = [];

      for (const item of items) {
        if (item.license === 'exclusive' && item.beat_id) {
          await supabase.rpc('acquire_exclusive_beat', {
            p_beat_id: item.beat_id
          });
        }

        // Notify producer & collect download links
        if (item.beat_id) {
          try {
            const { data: beat } = await supabase
              .from('beats')
              .select('id, title, producer_id, master_wav_key, stems_zip_key, producer:producer_id(id, display_name, handle)')
              .eq('id', item.beat_id)
              .maybeSingle();

            if (beat) {
              const producerName = (beat.producer as any)?.display_name || 'Producer';
              const beatTitle = beat.title;
              const priceNgn = item.price ? Number(item.price) : 30000;
              const earningsNgn = Math.round(priceNgn * 0.8).toLocaleString();
              const licenseType = item.license === 'exclusive' ? 'exclusive' : 'premium';

              let stemsDownloadUrl: string | null = null;
              let masterWavDownloadUrl: string | null = null;

              if (beat.stems_zip_key) {
                try {
                  stemsDownloadUrl = await getPresignedDownloadUrl(
                    beat.stems_zip_key,
                    `${beat.title} - Stems.zip`,
                    60 * 60 * 24 * 7
                  );
                } catch (err) {
                  stemsDownloadUrl = `https://cautionstudioz.com/api/media/${encodeURIComponent(beat.stems_zip_key)}?download=1&filename=${encodeURIComponent(`${beat.title} - Stems.zip`)}`;
                }
              }

              if (beat.master_wav_key) {
                try {
                  masterWavDownloadUrl = await getPresignedDownloadUrl(
                    beat.master_wav_key,
                    `${beat.title} - Master WAV.wav`,
                    60 * 60 * 24 * 7
                  );
                } catch (err) {
                  masterWavDownloadUrl = `https://cautionstudioz.com/api/media/${encodeURIComponent(beat.master_wav_key)}?download=1&filename=${encodeURIComponent(`${beat.title} - Master WAV.wav`)}`;
                }
              }

              emailDeliveryItems.push({
                beatTitle: beat.title,
                producerName,
                licenseType,
                priceNgn,
                stemsDownloadUrl,
                masterWavDownloadUrl,
                hasStems: !!beat.stems_zip_key
              });

              if (beat.producer_id) {
                await supabase.from('chats').insert({
                  sender_id: beat.producer_id,
                  recipient_id: beat.producer_id,
                  beat_id: beat.id,
                  content: `🎉 CONGRATULATIONS ${producerName}! Your beat "${beatTitle}" has just been licensed on Caution Studio Beat Store for ₦${priceNgn.toLocaleString()}. Your 80% creator share (₦${earningsNgn}) has been credited to your royalty balance.`,
                  is_encrypted: false,
                  has_contact_info: false
                });

                console.log(`[PRODUCER EMAIL NOTIFICATION] 🎉 Congratulations ${producerName}! Beat "${beatTitle}" sold for ₦${priceNgn}. ₦${earningsNgn} credited.`);
              }
            }
          } catch (notifErr) {
            console.warn('Failed to send producer notification:', notifErr);
          }
        }
      }

      // Send delivery email to customer with stems and master audio
      if (emailDeliveryItems.length > 0) {
        let buyerEmail = (data.customer?.email || metadata.email || '').toLowerCase().trim();
        let buyerName = data.customer?.first_name || (data.customer?.metadata as any)?.name;

        if (!buyerEmail && metadata.user_id) {
          try {
            const { data: userRecord } = await supabase.auth.admin.getUserById(metadata.user_id);
            if (userRecord?.user?.email) {
              buyerEmail = userRecord.user.email.toLowerCase().trim();
              buyerName = buyerName || userRecord.user.user_metadata?.name || userRecord.user.user_metadata?.full_name;
            }
          } catch (e) {}
        }

        if (buyerEmail) {
          const totalPaid = Math.round((data.amount || 0) / 100);
          await sendBeatPurchaseDeliveryEmail({
            buyerEmail,
            buyerName,
            orderId,
            reference,
            totalAmountNgn: totalPaid,
            items: emailDeliveryItems
          });
        }
      }

      // Notify support@cautionstudioz.com of paid order
      await sendAdminNotification({
        event: 'LICENSE_PURCHASED',
        subject: `💰 Beat License Purchased: ₦${((data.amount || 0) / 100).toLocaleString()} (Ref: ${reference})`,
        title: 'Beat Store License Payment Succeeded',
        description: `A customer has successfully completed payment for a music license on Caution Studios.`,
        details: {
          'Amount': `₦${((data.amount || 0) / 100).toLocaleString()}`,
          'Paystack Ref': reference,
          'Customer Email': data.customer?.email || 'N/A',
          'Order ID': orderId || 'Direct',
          'Items Count': items.length
        },
        ctaUrl: 'https://admin.cautionstudioz.com/orders'
      });

      return NextResponse.json({ success: true, reference, orderId });
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Paystack webhook error:', err);
    return NextResponse.json({ error: 'Internal server error processing webhook' }, { status: 500 });
  }
}
