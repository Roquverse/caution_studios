import { NextRequest, NextResponse } from 'next/server';
import { initializePaystack } from '../../../../lib/paystack';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, amountNgn, orderId, metadata, callbackUrl } = body;

    if (!email || !amountNgn || !orderId) {
      return NextResponse.json(
        { error: 'Missing required parameters: email, amountNgn, orderId' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const parsedAmount = Number(amountNgn);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid transaction amount' }, { status: 400 });
    }

    const res = await initializePaystack({
      email: email.trim().toLowerCase(),
      amountNgn: parsedAmount,
      orderId,
      callbackUrl,
      metadata
    });

    return NextResponse.json(res);
  } catch (error: any) {
    console.error('Paystack user initialization error:', error);
    return NextResponse.json({ error: error.message || 'Payment initialization failed' }, { status: 500 });
  }
}

