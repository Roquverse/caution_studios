import { NextRequest, NextResponse } from 'next/server';
import { sendAdminNotification } from '../../../../lib/emailNotifier';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { payoutId, producerId, amountNgn, netNgn, bankName, accountNumber, accountName } = await req.json();

    await sendAdminNotification({
      event: 'PAYOUT_REQUESTED',
      subject: `💸 Payout Withdrawal Requested: ₦${Number(amountNgn || 0).toLocaleString()} (${bankName || 'Bank'})`,
      title: 'Producer Earnings Withdrawal Request',
      description: `A music producer has requested a payout withdrawal of their royalty earnings.`,
      details: {
        'Gross Amount': `₦${Number(amountNgn || 0).toLocaleString()}`,
        'Transfer Fee': `₦100`,
        'Net Payable': `₦${Number(netNgn || (amountNgn - 100)).toLocaleString()}`,
        'Bank Name': bankName || 'N/A',
        'Account Number': accountNumber || 'N/A',
        'Account Name': accountName || 'N/A',
        'Producer ID': producerId || 'N/A',
        'Payout ID': payoutId || 'N/A'
      },
      ctaUrl: 'https://admin.cautionstudioz.com/payouts'
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error sending payout notification:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
