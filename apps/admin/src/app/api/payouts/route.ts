import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { verifyAdminRequest } from '../../../lib/adminAuth';
import { sendAdminNotification } from '../../../lib/emailNotifier';

export const dynamic = 'force-dynamic';

// GET /api/payouts - Fetch monthly breakdown, products sold, producer balances & payout requests
export async function GET(req: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);
    const monthFilter = searchParams.get('month'); // '2026-11' or null for current

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const selectedMonth = monthFilter || currentYearMonth;

    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10) || now.getFullYear();
    const month = parseInt(monthStr, 10) - 1 || now.getMonth();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // 1. Fetch Orders (Beat Sales & Subscriptions)
    const { data: allOrders, error: ordersErr } = await supabase
      .from('orders')
      .select(`
        id,
        buyer_id,
        status,
        subtotal_cents,
        total_cents,
        paystack_reference,
        created_at,
        profiles (
          id,
          display_name,
          handle,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (ordersErr) console.warn('Orders fetch error:', ordersErr);

    // 2. Fetch Order Items & Beats (to calculate beat license revenue per producer)
    const { data: orderItems, error: oiErr } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        beat_id,
        license,
        price_cents,
        producer_amount_cents,
        created_at,
        beat:beats (
          id,
          title,
          producer_id,
          producer:producer_id (
            id,
            display_name,
            handle
          )
        )
      `);

    if (oiErr) console.warn('Order items fetch error:', oiErr);

    // 3. Fetch Ad Campaigns
    const { data: adCampaigns, error: adsErr } = await supabase
      .from('ad_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (adsErr) console.warn('Ads fetch error:', adsErr);

    // 4. Fetch All Producers
    const { data: allProfiles, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .order('display_name', { ascending: true });

    if (profErr) console.warn('Profiles fetch error:', profErr);

    // Fetch auth emails for profiles
    let emailMap: Record<string, string> = {};
    try {
      const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      (authData?.users || []).forEach((u) => {
        if (u.id && u.email) emailMap[u.id] = u.email;
      });
    } catch (e) {}

    // 5. Fetch Payout Requests
    const { data: allPayouts, error: payoutsErr } = await supabase
      .from('payouts')
      .select(`
        *,
        producer:producer_id (
          id,
          display_name,
          handle,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (payoutsErr) console.warn('Payouts fetch error:', payoutsErr);

    // 6. Fetch Catalog Beats to associate with producers
    const { data: allBeats } = await supabase
      .from('beats')
      .select('id, title, producer_id, play_count, free_commercial_downloads_count, created_at');

    // -------------------------------------------------------------
    // CALCULATIONS & BALANCES
    // -------------------------------------------------------------

    // Filter by selected month
    const isSelectedMonth = (dateStr: string) => {
      const d = new Date(dateStr);
      return d >= startOfMonth && d <= endOfMonth;
    };

    const paidOrders = (allOrders || []).filter((o) => o.status === 'paid');
    const monthPaidOrders = paidOrders.filter((o) => isSelectedMonth(o.created_at));

    // Distinguish Beat License Sales vs Subscriptions
    let monthBeatSalesCount = 0;
    let monthBeatGrossNgn = 0;
    let monthSubsCount = 0;
    let monthSubsGrossNgn = 0;

    let lifetimeBeatSalesCount = 0;
    let lifetimeBeatGrossNgn = 0;
    let lifetimeSubsCount = 0;
    let lifetimeSubsGrossNgn = 0;

    // Map order items to orders
    const orderItemsMap: Record<string, any[]> = {};
    (orderItems || []).forEach((oi) => {
      if (oi.order_id) {
        orderItemsMap[oi.order_id] = orderItemsMap[oi.order_id] || [];
        orderItemsMap[oi.order_id].push(oi);
      }
    });

    paidOrders.forEach((o) => {
      const isSub = (o.paystack_reference || '').includes('sub_') || o.total_cents === 300000 || o.total_cents === 1000000;
      const orderAmountNgn = (o.total_cents || 0) / 100;
      const inMonth = isSelectedMonth(o.created_at);

      if (isSub) {
        lifetimeSubsCount++;
        lifetimeSubsGrossNgn += orderAmountNgn;
        if (inMonth) {
          monthSubsCount++;
          monthSubsGrossNgn += orderAmountNgn;
        }
      } else {
        lifetimeBeatSalesCount++;
        lifetimeBeatGrossNgn += orderAmountNgn;
        if (inMonth) {
          monthBeatSalesCount++;
          monthBeatGrossNgn += orderAmountNgn;
        }
      }
    });

    // Ad Campaigns Revenue
    const paidAds = (adCampaigns || []).filter((a) => a.status === 'active' || a.paystack_reference);
    const monthAds = paidAds.filter((a) => isSelectedMonth(a.created_at || a.starts_at));
    const monthAdsGrossNgn = monthAds.reduce((acc, curr) => acc + (Number(curr.price_ngn) || 0), 0);
    const lifetimeAdsGrossNgn = paidAds.reduce((acc, curr) => acc + (Number(curr.price_ngn) || 0), 0);

    // Percentages:
    // Beat Sales: 80% to Producer, 20% to Platform
    // Subscriptions: 100% Platform
    // Ads: 100% Platform
    const monthProducerBeatShareNgn = Math.round(monthBeatGrossNgn * 0.8);
    const monthPlatformBeatFeeNgn = Math.round(monthBeatGrossNgn * 0.2);

    const monthTotalGrossNgn = monthBeatGrossNgn + monthSubsGrossNgn + monthAdsGrossNgn;
    const monthPlatformNetGainNgn = monthPlatformBeatFeeNgn + monthSubsGrossNgn + monthAdsGrossNgn;

    const lifetimeProducerBeatShareNgn = Math.round(lifetimeBeatGrossNgn * 0.8);
    const lifetimePlatformBeatFeeNgn = Math.round(lifetimeBeatGrossNgn * 0.2);
    const lifetimeTotalGrossNgn = lifetimeBeatGrossNgn + lifetimeSubsGrossNgn + lifetimeAdsGrossNgn;
    const lifetimePlatformNetGainNgn = lifetimePlatformBeatFeeNgn + lifetimeSubsGrossNgn + lifetimeAdsGrossNgn;

    // -------------------------------------------------------------
    // PRODUCER LEDGER (Who needs to be paid & each producer's revenue)
    // -------------------------------------------------------------
    const producerBeatsMap: Record<string, any[]> = {};
    (allBeats || []).forEach((b) => {
      if (b.producer_id) {
        producerBeatsMap[b.producer_id] = producerBeatsMap[b.producer_id] || [];
        producerBeatsMap[b.producer_id].push(b);
      }
    });

    // Map beat sales to producer
    const producerSalesMap: Record<string, { monthCount: number; monthGrossNgn: number; lifetimeCount: number; lifetimeGrossNgn: number }> = {};
    (orderItems || []).forEach((oi: any) => {
      const beatObj = Array.isArray(oi.beat) ? oi.beat[0] : oi.beat;
      const prodId = beatObj?.producer_id;
      if (prodId) {
        producerSalesMap[prodId] = producerSalesMap[prodId] || { monthCount: 0, monthGrossNgn: 0, lifetimeCount: 0, lifetimeGrossNgn: 0 };
        const priceNgn = (oi.price_cents || 0) / 100;
        producerSalesMap[prodId].lifetimeCount++;
        producerSalesMap[prodId].lifetimeGrossNgn += priceNgn;
        if (isSelectedMonth(oi.created_at)) {
          producerSalesMap[prodId].monthCount++;
          producerSalesMap[prodId].monthGrossNgn += priceNgn;
        }
      }
    });

    // Only include profiles with role 'producer' or who have uploaded beats
    const producerProfiles = (allProfiles || []).filter((p) => {
      const roles = Array.isArray(p.roles) ? p.roles : [];
      const hasUploaded = (producerBeatsMap[p.id] || []).length > 0;
      return roles.includes('producer') || hasUploaded;
    });

    const producerLedger = producerProfiles.map((p) => {
      const sales = producerSalesMap[p.id] || { monthCount: 0, monthGrossNgn: 0, lifetimeCount: 0, lifetimeGrossNgn: 0 };
      const catalog = producerBeatsMap[p.id] || [];
      const totalCatalogPlays = catalog.reduce((acc, curr) => acc + (curr.play_count || 0), 0);
      const totalCatalogDownloads = catalog.reduce((acc, curr) => acc + (Number(curr.free_commercial_downloads_count) || 0), 0);

      const availableBalance = Number(p.available_balance_ngn) || 0;
      const pendingBalance = Number(p.pending_balance_ngn) || 0;

      const lifetimeEarned80PctNgn = Math.round(sales.lifetimeGrossNgn * 0.8);
      const monthEarned80PctNgn = Math.round(sales.monthGrossNgn * 0.8);

      const hasBank = Boolean(p.paystack_account_number && p.paystack_bank_name);
      const needsPayment = availableBalance > 0;

      return {
        id: p.id,
        name: p.display_name || p.handle || 'Producer',
        handle: p.handle || 'producer',
        avatar_url: p.avatar_url,
        email: emailMap[p.id] || 'No email on file',
        catalogCount: catalog.length,
        totalPlays: totalCatalogPlays,
        totalDownloads: totalCatalogDownloads,
        monthBeatsSold: sales.monthCount,
        monthGrossRevenueNgn: sales.monthGrossNgn,
        monthProducerEarned80PctNgn: monthEarned80PctNgn,
        lifetimeBeatsSold: sales.lifetimeCount,
        lifetimeGrossRevenueNgn: sales.lifetimeGrossNgn,
        lifetimeProducerEarned80PctNgn: lifetimeEarned80PctNgn,
        availableBalanceNgn: availableBalance,
        pendingBalanceNgn: pendingBalance,
        needsPayment,
        bankDetails: {
          hasBank,
          bankName: p.paystack_bank_name || null,
          accountNumber: p.paystack_account_number || null,
          accountName: p.paystack_account_name || null,
          bankCode: p.paystack_bank_code || null
        }
      };
    });

    // Sort: producers who need payment first, then by available balance descending
    producerLedger.sort((a, b) => {
      if (a.needsPayment !== b.needsPayment) return a.needsPayment ? -1 : 1;
      return b.availableBalanceNgn - a.availableBalanceNgn;
    });

    // -------------------------------------------------------------
    // PAYOUT REQUESTS LEDGER
    // -------------------------------------------------------------
    const formattedPayouts = (allPayouts || []).map((p: any) => {
      const prodProf = Array.isArray(p.producer) ? p.producer[0] : p.producer;
      return {
        id: p.id,
        producerId: p.producer_id,
        producerName: prodProf?.display_name || 'Producer',
        producerHandle: prodProf?.handle || 'producer',
        producerAvatar: prodProf?.avatar_url || null,
        producerEmail: emailMap[p.producer_id] || 'N/A',
        amountNgn: Number(p.amount_ngn) || 0,
        feeNgn: Number(p.fee_ngn) || 0,
        netNgn: Number(p.net_ngn) || 0,
        bankName: p.bank_name,
        accountNumber: p.account_number,
        accountName: p.account_name,
        status: p.status || 'pending',
        reference: p.paystack_transfer_reference || `trf_${p.id.slice(0, 8)}`,
        createdAt: p.created_at,
        completedAt: p.completed_at,
        inSelectedMonth: isSelectedMonth(p.created_at)
      };
    });

    const monthPayouts = formattedPayouts.filter((p) => p.inSelectedMonth);
    const pendingPayoutsCount = formattedPayouts.filter((p) => p.status === 'pending').length;
    const pendingPayoutsAmountNgn = formattedPayouts
      .filter((p) => p.status === 'pending')
      .reduce((acc, curr) => acc + curr.amountNgn, 0);

    return NextResponse.json({
      selectedMonth,
      monthName: startOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      balanceSummary: {
        // Month stats
        monthTotalGrossNgn,
        monthPlatformNetGainNgn,
        monthProducerBeatShareNgn,
        monthPlatformBeatFeeNgn,
        monthBeatSalesCount,
        monthBeatGrossNgn,
        monthSubsCount,
        monthSubsGrossNgn,
        monthAdsCount: monthAds.length,
        monthAdsGrossNgn,

        // Lifetime stats
        lifetimeTotalGrossNgn,
        lifetimePlatformNetGainNgn,
        lifetimeProducerBeatShareNgn,
        lifetimePlatformBeatFeeNgn,
        lifetimeBeatSalesCount,
        lifetimeBeatGrossNgn,
        lifetimeSubsCount,
        lifetimeSubsGrossNgn,
        lifetimeAdsGrossNgn,

        // Payout pipeline
        pendingPayoutsCount,
        pendingPayoutsAmountNgn
      },
      producerLedger,
      payoutRequests: formattedPayouts,
      monthPayoutRequests: monthPayouts
    });
  } catch (err: any) {
    console.error('Error in GET /api/payouts:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/payouts - Admin approves, marks paid, or rejects a producer payout request
export async function POST(req: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

    const supabase = getServiceRoleClient();
    const body = await req.json();
    const { action, payoutId, producerId, transferReference, note } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // ACTION: APPROVE & MARK PAID
    if (action === 'approve') {
      if (!payoutId) return NextResponse.json({ error: 'Payout ID is required' }, { status: 400 });

      const { data: payout, error: pFetchErr } = await supabase
        .from('payouts')
        .select('*')
        .eq('id', payoutId)
        .single();

      if (pFetchErr || !payout) {
        return NextResponse.json({ error: 'Payout request not found' }, { status: 404 });
      }

      const completedAt = new Date().toISOString();
      const ref = transferReference || payout.paystack_transfer_reference || `trf_${Date.now()}`;

      // 1. Update payout record to completed
      const { error: pUpdErr } = await supabase
        .from('payouts')
        .update({
          status: 'completed',
          completed_at: completedAt,
          paystack_transfer_reference: ref
        })
        .eq('id', payoutId);

      if (pUpdErr) throw pUpdErr;

      // 2. Deduct from producer's pending balance
      const { data: producer } = await supabase
        .from('profiles')
        .select('pending_balance_ngn, display_name')
        .eq('id', payout.producer_id)
        .single();

      if (producer) {
        const curPending = Number(producer.pending_balance_ngn) || 0;
        const newPending = Math.max(0, curPending - Number(payout.amount_ngn));
        await supabase
          .from('profiles')
          .update({ pending_balance_ngn: newPending })
          .eq('id', payout.producer_id);
      }

      // 3. Send producer notification via in-app chat
      await supabase.from('chats').insert({
        sender_id: payout.producer_id,
        recipient_id: payout.producer_id,
        content: `🎉 Payout Completed! Your withdrawal of ₦${Number(payout.net_ngn || payout.amount_ngn).toLocaleString()} has been sent to your bank account (${payout.bank_name} ••••${payout.account_number?.slice(-4)}). Ref: ${ref}.`,
        is_encrypted: false,
        has_contact_info: false
      });

      sendAdminNotification({
        event: 'PAYOUT_REQUESTED',
        subject: `✅ Payout Approved: ₦${Number(payout.net_ngn).toLocaleString()} to ${producer?.display_name || 'Producer'}`,
        title: 'Producer Payout Settled',
        description: `Admin approved payout of ₦${Number(payout.net_ngn).toLocaleString()} to ${payout.account_name} (${payout.bank_name}).`,
        details: {
          'Producer': producer?.display_name || 'Producer',
          'Net Amount': `₦${Number(payout.net_ngn).toLocaleString()}`,
          'Bank': payout.bank_name,
          'Account': payout.account_number,
          'Transfer Ref': ref
        },
        ctaUrl: 'https://admin.cautionstudioz.com/payouts'
      }).catch((e) => console.warn('Notification email error:', e));

      return NextResponse.json({ success: true, message: 'Payout approved and marked as completed' });
    }

    // ACTION: REJECT & REFUND
    if (action === 'reject') {
      if (!payoutId) return NextResponse.json({ error: 'Payout ID is required' }, { status: 400 });

      const { data: payout, error: pFetchErr } = await supabase
        .from('payouts')
        .select('*')
        .eq('id', payoutId)
        .single();

      if (pFetchErr || !payout) {
        return NextResponse.json({ error: 'Payout request not found' }, { status: 404 });
      }

      // Update payout status to failed
      await supabase
        .from('payouts')
        .update({ status: 'failed' })
        .eq('id', payoutId);

      // Refund amount back to producer available_balance_ngn and deduct from pending
      const { data: producer } = await supabase
        .from('profiles')
        .select('available_balance_ngn, pending_balance_ngn')
        .eq('id', payout.producer_id)
        .single();

      if (producer) {
        const curAvail = Number(producer.available_balance_ngn) || 0;
        const curPending = Number(producer.pending_balance_ngn) || 0;
        await supabase
          .from('profiles')
          .update({
            available_balance_ngn: curAvail + Number(payout.amount_ngn),
            pending_balance_ngn: Math.max(0, curPending - Number(payout.amount_ngn))
          })
          .eq('id', payout.producer_id);
      }

      // Notify producer
      await supabase.from('chats').insert({
        sender_id: payout.producer_id,
        recipient_id: payout.producer_id,
        content: `⚠️ Payout Request Cancelled: Your withdrawal request for ₦${Number(payout.amount_ngn).toLocaleString()} was rejected${note ? `: "${note}"` : ''}. Funds have been restored to your available royalty balance. Please check your bank details.`,
        is_encrypted: false,
        has_contact_info: false
      });

      return NextResponse.json({ success: true, message: 'Payout request rejected and funds restored' });
    }

    // ACTION: DIRECT MANUAL SETTLEMENT / PAYOUT INITIATION
    if (action === 'direct_payout') {
      if (!producerId) return NextResponse.json({ error: 'Producer ID is required' }, { status: 400 });

      const { data: producer } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', producerId)
        .single();

      if (!producer) return NextResponse.json({ error: 'Producer not found' }, { status: 404 });

      const amountToSettle = Number(body.amountNgn) || Number(producer.available_balance_ngn) || 0;
      if (amountToSettle <= 0) {
        return NextResponse.json({ error: 'Cannot settle zero or negative balance' }, { status: 400 });
      }

      const fee = 100;
      const net = Math.max(0, amountToSettle - fee);
      const ref = transferReference || `trf_admin_${Date.now()}`;

      // Insert completed payout record
      const { data: newPayout, error: insErr } = await supabase
        .from('payouts')
        .insert({
          producer_id: producerId,
          amount_ngn: amountToSettle,
          fee_ngn: fee,
          net_ngn: net,
          bank_name: producer.paystack_bank_name || 'Direct Bank Settlement',
          bank_code: producer.paystack_bank_code || '000',
          account_number: producer.paystack_account_number || 'N/A',
          account_name: producer.paystack_account_name || producer.display_name,
          paystack_transfer_reference: ref,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insErr) throw insErr;

      // Deduct settled amount from available_balance_ngn
      const currentAvail = Number(producer.available_balance_ngn) || 0;
      await supabase
        .from('profiles')
        .update({
          available_balance_ngn: Math.max(0, currentAvail - amountToSettle)
        })
        .eq('id', producerId);

      return NextResponse.json({ success: true, message: `Successfully settled ₦${net.toLocaleString()} to ${producer.display_name}`, payout: newPayout });
    }

    // ACTION: ADJUST BALANCE
    if (action === 'adjust_balance') {
      if (!producerId) return NextResponse.json({ error: 'Producer ID is required' }, { status: 400 });
      const adjustmentNgn = Number(body.adjustmentNgn);
      if (isNaN(adjustmentNgn)) return NextResponse.json({ error: 'Valid adjustment amount required' }, { status: 400 });

      const { data: producer } = await supabase
        .from('profiles')
        .select('available_balance_ngn, display_name')
        .eq('id', producerId)
        .single();

      if (!producer) return NextResponse.json({ error: 'Producer not found' }, { status: 404 });

      const newBalance = Math.max(0, (Number(producer.available_balance_ngn) || 0) + adjustmentNgn);
      await supabase
        .from('profiles')
        .update({ available_balance_ngn: newBalance })
        .eq('id', producerId);

      return NextResponse.json({ success: true, message: `Updated balance for ${producer.display_name} to ₦${newBalance.toLocaleString()}`, newBalance });
    }

    return NextResponse.json({ error: 'Unrecognized action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in POST /api/payouts:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
