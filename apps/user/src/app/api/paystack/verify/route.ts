import { NextRequest, NextResponse } from 'next/server';
import { verifyPaystack } from '../../../../lib/paystack';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';
import { sendBeatPurchaseDeliveryEmail, PurchasedBeatEmailItem } from '../../../../lib/emailNotifier';
import { getPresignedDownloadUrl } from '../../../../lib/r2Server';

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
    const isProd = process.env.NODE_ENV === 'production';
    const isDevMockAllowed = !isProd && !process.env.PAYSTACK_SECRET_KEY;
    const isSuccess =
      data.status === 'success' ||
      (isDevMockAllowed && (reference.startsWith('demo_ref_') || reference.startsWith('test_')));

    if (!isSuccess) {
      return NextResponse.json(
        { error: `Transaction status is '${data.status || 'failed'}'` },
        { status: 400 }
      );
    }

    const metadata = data.metadata || {};
    const supabase = getServiceRoleClient();

    // 0. Extract user from Authorization Bearer token if provided
    let authHeaderUserId: string | null = null;
    let authHeaderEmail: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '').trim();
        const { data: authUserData } = await supabase.auth.getUser(token);
        if (authUserData?.user) {
          authHeaderUserId = authUserData.user.id;
          authHeaderEmail = authUserData.user.email || null;
        }
      } catch (authErr) {
        console.warn('Could not verify bearer token in paystack verify:', authErr);
      }
    }

    // 1. Handle Subscription Verification (Caution Plus @ 3k or Caution Pro @ 10k/30k)
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

      let targetUserId =
        bodyUserId ||
        authHeaderUserId ||
        metadata.user_id ||
        metadata.userId;

      const customerEmail = (
        data.customer?.email ||
        bodyEmail ||
        authHeaderEmail ||
        metadata.email ||
        metadata.user_email ||
        ''
      ).toLowerCase().trim();

      // If user ID was not passed, resolve user by email via profiles or auth.admin
      if (!targetUserId && customerEmail) {
        try {
          // Check profiles table first (direct lookup)
          const { data: matchedProfile } = await supabase
            .from('profiles')
            .select('id')
            .ilike('email', customerEmail)
            .maybeSingle();

          if (matchedProfile?.id) {
            targetUserId = matchedProfile.id;
          } else {
            // Paginated auth users lookup
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
              if (authList.users.length < 100) {
                hasMore = false;
              } else {
                page++;
              }
            }
          }
        } catch (e) {
          console.warn('Error matching customer by email in verify:', e);
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
      } else {
        console.warn('Could not associate subscription transaction with a specific user:', {
          reference,
          customerEmail,
          metadata
        });
      }

      // Check if order already recorded
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('paystack_reference', reference)
        .maybeSingle();

      if (!existingOrder) {
        const amountCents = data.amount || (targetPlan === 'pro' ? 1000000 : 300000);
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

    // 2. Handle Ad Promotion Campaign Verification
    const isAdCampaign =
      metadata.type === 'ad_campaign' ||
      (bodyOrderId && bodyOrderId.startsWith('ad_')) ||
      reference.includes('ad_camp') ||
      reference.includes('ad_order');

    if (isAdCampaign) {
      const campId = metadata.campaignId || metadata.campaign_id;
      let adRecord: any = null;

      if (campId) {
        const { data: updatedCamp } = await supabase
          .from('ad_campaigns')
          .update({
            status: 'active',
            paystack_reference: reference
          })
          .eq('id', campId)
          .select()
          .maybeSingle();
        adRecord = updatedCamp;
      } else if (metadata.songTitle) {
        const adType = metadata.adType || 'listening';
        const tagPrefix = adType === 'download' ? '[DOWNLOAD AD] ' : '[STREAM AD] ';
        const rawCampaignName = metadata.campaignName || `Promote "${metadata.songTitle}"`;
        const resolvedCampaignName = rawCampaignName.includes('[') ? rawCampaignName : `${tagPrefix}${rawCampaignName}`;

        const insertPayload: any = {
          advertiser_id: metadata.advertiserId || bodyUserId || null,
          campaign_name: resolvedCampaignName,
          artist_name: metadata.artistName || 'Artist',
          song_title: metadata.songTitle,
          package_name: metadata.packageName || adType,
          price_ngn: metadata.priceNgn || 15000,
          target_plays: metadata.targetPlays || 5000,
          delivered_plays: 0,
          clicks_count: 0,
          audio_url: metadata.audioUrl || '',
          cover_url: metadata.coverUrl || '/images/hero_boombox.jpg',
          spotify_url: metadata.spotifyUrl || null,
          apple_music_url: metadata.appleMusicUrl || null,
          audiomack_url: metadata.audiomackUrl || null,
          youtube_url: metadata.youtubeUrl || null,
          status: 'active',
          paystack_reference: reference,
          starts_at: new Date().toISOString()
        };

        const { data: createdCamp } = await supabase
          .from('ad_campaigns')
          .insert(insertPayload)
          .select()
          .maybeSingle();
        adRecord = createdCamp;
      }

      // Record transaction into orders ledger
      const amountCents = data.amount || (metadata.priceNgn ? Number(metadata.priceNgn) * 100 : 1500000);
      await supabase.from('orders').insert({
        buyer_id: metadata.advertiserId || bodyUserId || null,
        status: 'paid',
        subtotal_cents: amountCents,
        credit_cents: 0,
        tax_cents: 0,
        total_cents: amountCents,
        paystack_reference: reference,
        created_at: new Date().toISOString()
      });

      return NextResponse.json({
        status: true,
        verified: true,
        type: 'ad_campaign',
        campaign: adRecord,
        reference
      });
    }

    // 3. Handle Beat License Purchase Verification
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
    const emailDeliveryItems: PurchasedBeatEmailItem[] = [];

    // Helper to process beat item
    const processBeatItem = async (bId: string, bLicense: string, bPriceNgn: number) => {
      const isExclusive = String(bLicense || '').toLowerCase().trim() === 'exclusive';
      if (isExclusive) {
        try {
          await supabase.rpc('acquire_exclusive_beat', { p_beat_id: bId });
        } catch (e) {
          console.warn('Exclusive lock error:', e);
        }
        try {
          await supabase.from('beats').update({ status: 'sold', sold_at: new Date().toISOString() }).eq('id', bId);
          await supabase.from('beat_licenses').update({ enabled: false }).eq('beat_id', bId);
        } catch (e) {
          console.warn('Error setting beat to sold:', e);
        }
      }

      try {
        const { data: beat } = await supabase
          .from('beats')
          .select('id, title, producer_id, master_wav_key, stems_zip_key, cover_url, producer:producer_id(id, display_name, handle)')
          .eq('id', bId)
          .maybeSingle();

        if (beat) {
          purchasedBeatTitle = beat.title;
          const producerName = (beat.producer as any)?.display_name || 'Producer';
          const earningsNgn = Math.round(bPriceNgn * 0.8).toLocaleString();
          const licenseType = bLicense === 'exclusive' ? 'exclusive' : 'premium';

          // Generate presigned download links for Stems ZIP & Master WAV (7-day validity)
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
            priceNgn: bPriceNgn,
            stemsDownloadUrl,
            masterWavDownloadUrl,
            hasStems: !!beat.stems_zip_key
          });

          if (beat.producer_id) {
            await supabase.from('chats').insert({
              sender_id: beat.producer_id,
              recipient_id: beat.producer_id,
              beat_id: beat.id,
              content: `🎉 CONGRATULATIONS ${producerName}! Your beat "${beat.title}" has just been purchased via Paystack on Caution Studio for ₦${bPriceNgn.toLocaleString()}. Your 80% creator share (₦${earningsNgn}) has been credited.`,
              is_encrypted: false,
              has_contact_info: false
            });

            if (recordedOrderId) {
              const itemTotalCents = bPriceNgn * 100;
              const platformFeeCents = Math.round(itemTotalCents * 0.2);
              const producerAmountCents = itemTotalCents - platformFeeCents;

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
        }
      } catch (e) {
        console.warn('Error recording beat purchase in database:', e);
      }
    };

    if (beatId) {
      const priceNgn = metadata.priceNgn ? Number(metadata.priceNgn) : Math.round(totalAmountCents / 100);
      await processBeatItem(beatId, metadata.license || 'premium', priceNgn);
    } else if (items.length > 0) {
      for (const item of items) {
        if (!item.beat_id) continue;
        await processBeatItem(item.beat_id, item.license || 'premium', item.price || 15000);
      }
    }

    // Send delivery email to customer with stems and master audio
    if (emailDeliveryItems.length > 0) {
      let buyerEmail = (data.customer?.email || bodyEmail || metadata.email || '').toLowerCase().trim();
      let buyerName = data.customer?.first_name || (data.customer?.metadata as any)?.name;

      if (!buyerEmail && targetUserId) {
        try {
          const { data: userRecord } = await supabase.auth.admin.getUserById(targetUserId);
          if (userRecord?.user?.email) {
            buyerEmail = userRecord.user.email.toLowerCase().trim();
            buyerName = buyerName || userRecord.user.user_metadata?.name || userRecord.user.user_metadata?.full_name;
          }
        } catch (e) {}
      }

      if (buyerEmail) {
        const totalPaid = Math.round(totalAmountCents / 100);
        await sendBeatPurchaseDeliveryEmail({
          buyerEmail,
          buyerName,
          orderId: recordedOrderId || orderId,
          reference,
          totalAmountNgn: totalPaid,
          items: emailDeliveryItems
        });
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
