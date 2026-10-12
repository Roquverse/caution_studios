import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const id = req.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        buyer:buyer_id(*),
        items:order_items(
          *,
          beat:beat_id(*)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoiceRef = order.paystack_reference || `CS-INV-${new Date(order.created_at).getFullYear()}-${id.slice(0, 4).toUpperCase()}`;
    const amountNgn = order.total_cents ? order.total_cents / 100 : 0;
    const dateFormatted = new Date(order.created_at).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const isSubscription = (!order.items || order.items.length === 0);
    const description = isSubscription ? 'Caution Plus Annual / Monthly Subscription' : order.items.map((i: any) => `${i.beat?.title || 'Recording'} (${i.license} License)`).join(', ');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${invoiceRef}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #08090B; color: #FFFFFF; padding: 40px; margin: 0; }
    .card { max-width: 650px; margin: 0 auto; background: #121316; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 36px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 24px; }
    .logo { height: 28px; filter: brightness(0) invert(1); }
    .badge { background: rgba(4, 86, 79, 0.4); color: #2dd4bf; border: 1px solid rgba(45, 212, 191, 0.3); padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; letter-spacing: 0.05em; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 24px 0; font-size: 13px; color: #9CA3AF; }
    .meta-grid strong { color: #FFFFFF; display: block; margin-top: 4px; font-size: 14px; }
    .items-table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 13px; }
    .items-table th { text-align: left; color: #6B7280; text-transform: uppercase; font-size: 11px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .items-table td { padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .total-box { display: flex; justify-content: space-between; font-size: 18px; font-weight: 900; color: #2dd4bf; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; }
    .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #6B7280; }
    @media print {
      body { background: white; color: black; }
      .card { border: none; background: white; color: black; }
      .meta-grid strong { color: black; }
      .total-box { color: black; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <h2 style="margin: 0; font-size: 20px; font-weight: 900;">Caution Studio</h2>
        <span style="font-size: 11px; color: #9CA3AF;">Official Tax Receipt & Payment Proof</span>
      </div>
      <span class="badge">PAID IN FULL</span>
    </div>

    <div class="meta-grid">
      <div>
        <span>Invoice Number</span>
        <strong>${invoiceRef}</strong>
      </div>
      <div>
        <span>Date of Issue</span>
        <strong>${dateFormatted}</strong>
      </div>
      <div>
        <span>Billed To</span>
        <strong>${order.buyer?.display_name || 'Arakunrin Cole'} (${order.buyer?.handle ? '@' + order.buyer.handle : 'Licensed Artist'})</strong>
      </div>
      <div>
        <span>Payment Method</span>
        <strong>Paystack Direct Debit (NGN)</strong>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${description}</td>
          <td style="text-align: right; font-family: monospace; font-weight: bold;">₦${amountNgn.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-box">
      <span>Total Paid</span>
      <span style="font-family: monospace;">₦${amountNgn.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
    </div>

    <div class="footer">
      <p>Thank you for creating with Caution Studio. For license verification or commercial inquiries, contact legal@caution.studio.</p>
      <button onclick="window.print()" style="margin-top: 10px; background: #04564f; color: #2dd4bf; border: 1px solid #2dd4bf; border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: bold; cursor: pointer;">Print / Save as PDF</button>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
