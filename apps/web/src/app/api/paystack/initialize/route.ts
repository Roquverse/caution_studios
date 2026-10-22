import { NextRequest, NextResponse } from 'next/server';
import { initializePaystack } from '../../../../lib/paystack';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, amountNgn, orderId, metadata } = body;

    if (!email || !amountNgn || !orderId) {
      return NextResponse.json(
        { error: 'Missing required parameters: email, amountNgn, orderId' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Number validation
    const parsedAmount = Number(amountNgn);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid transaction amount' }, { status: 400 });
    }

    // Database verification if orderId is an existing order
    const supabase = getServiceRoleClient();
    const { data: dbOrder } = await supabase
      .from('orders')
      .select('id, total_cents, status')
      .eq('id', orderId)
      .maybeSingle();

    let verifiedAmountNgn = parsedAmount;
    if (dbOrder && dbOrder.total_cents) {
      // Check for price tampering
      const expectedAmountNgn = Math.round(dbOrder.total_cents / 100);
      if (Math.abs(expectedAmountNgn - parsedAmount) > 1) {
        return NextResponse.json(
          { error: `Price mismatch: Expected ₦${expectedAmountNgn}, got ₦${parsedAmount}` },
          { status: 400 }
        );
      }
      verifiedAmountNgn = expectedAmountNgn;
    }

    const res = await initializePaystack({
      email: email.trim().toLowerCase(),
      amountNgn: verifiedAmountNgn,
      orderId,
      metadata
    });

    return NextResponse.json(res);
  } catch (error: any) {
    console.error('Paystack initialization error:', error);
    return NextResponse.json({ error: error.message || 'Payment initialization failed' }, { status: 500 });
  }
}
