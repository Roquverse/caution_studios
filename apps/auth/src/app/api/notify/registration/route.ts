import { NextRequest, NextResponse } from 'next/server';
import { sendAdminNotification } from '../../../../lib/emailNotifier';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, name, role, plan } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    await sendAdminNotification({
      event: 'NEW_USER_REGISTERED',
      subject: `👤 New Member Registered: ${name || 'User'} (${role || 'artist'})`,
      title: 'New Account Created on Caution Studios',
      description: `A new ${role === 'producer' ? 'music producer' : 'recording artist'} has registered on the platform.`,
      details: {
        'Full Name': name || 'N/A',
        'Email Address': email,
        'Account Role': role === 'producer' ? 'Music Producer' : 'Recording Artist',
        'Initial Plan': (plan || 'free').toUpperCase(),
        'Registration Date': new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })
      },
      ctaUrl: 'https://admin.cautionstudioz.com/users'
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in registration notification:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
