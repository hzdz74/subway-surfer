import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get('customer_id');

  if (!customerId) {
    return NextResponse.redirect(new URL('/pricing', req.url));
  }

  const origin = req.headers.get('origin') ?? new URL(req.url).origin;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/`,
    });
    return NextResponse.redirect(session.url);
  } catch {
    return NextResponse.redirect(new URL('/pricing', req.url));
  }
}
