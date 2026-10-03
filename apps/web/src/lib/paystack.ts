/**
 * Paystack Integration Helpers for Caution Studio
 * Locked decision: Payments Paystack (NGN & Card processing)
 */

export interface InitializePaystackParams {
  email: string;
  amountNgn: number; // in Naira (will be multiplied by 100 for kobo)
  orderId: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export function formatNaira(amountNgn: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(amountNgn).replace('NGN', '₦');
}

/**
 * Initialize a Paystack transaction via server endpoint
 */
export async function initializePaystack(params: InitializePaystackParams): Promise<PaystackInitResponse> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    // Development / demo fallback
    return {
      status: true,
      message: 'Demo mode transaction initialized',
      data: {
        authorization_url: `/checkout/success?reference=demo_ref_${Date.now()}&order_id=${params.orderId}`,
        access_code: `demo_code_${Date.now()}`,
        reference: `caution_ref_${Date.now()}`
      }
    };
  }

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amountNgn * 100), // convert Naira to Kobo
      reference: `CS_${params.orderId.slice(0, 8)}_${Date.now()}`,
      callback_url: params.callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/checkout/success`,
      metadata: {
        order_id: params.orderId,
        ...params.metadata
      }
    })
  });

  return await response.json();
}

/**
 * Verify a Paystack transaction by reference
 */
export async function verifyPaystack(reference: string): Promise<any> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    return {
      status: true,
      data: {
        status: 'success',
        reference,
        amount: 300000,
        currency: 'NGN'
      }
    };
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`
    }
  });

  return await response.json();
}
