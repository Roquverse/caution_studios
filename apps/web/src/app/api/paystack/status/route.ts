import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY || '';
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

  const secretPrefix = secretKey ? (secretKey.startsWith('sk_live_') ? 'sk_live_' : (secretKey.startsWith('sk_test_') ? 'sk_test_' : secretKey.slice(0, 7))) : 'NOT_CONFIGURED';
  const publicPrefix = publicKey ? (publicKey.startsWith('pk_live_') ? 'pk_live_' : (publicKey.startsWith('pk_test_') ? 'pk_test_' : publicKey.slice(0, 7))) : 'NOT_CONFIGURED';

  const isLive = secretKey.startsWith('sk_live_') && publicKey.startsWith('pk_live_');
  const isTest = secretKey.startsWith('sk_test_') || publicKey.startsWith('pk_test_');

  return NextResponse.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'production',
    mode: isLive ? 'LIVE' : (isTest ? 'TEST' : 'UNCONFIGURED_OR_PARTIAL'),
    keys: {
      PAYSTACK_SECRET_KEY: secretPrefix,
      NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: publicPrefix
    },
    recommendation: isLive
      ? 'Keys are correctly set to LIVE.'
      : 'Ensure both PAYSTACK_SECRET_KEY (starts with sk_live_) and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY (starts with pk_live_) are configured in your Vercel project environment variables.'
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}
