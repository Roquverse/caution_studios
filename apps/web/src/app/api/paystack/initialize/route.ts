import { NextRequest, NextResponse } from 'next/server';
import { initializePaystack } from '../../../../lib/paystack';

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

    const res = await initializePaystack({
      email,
      amountNgn,
      orderId,
      metadata
    });

    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
