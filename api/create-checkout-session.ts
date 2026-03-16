import Stripe from 'stripe';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const appUrl = process.env.APP_URL || process.env.VERCEL_URL;
  if (!appUrl) {
    return res.status(500).json({ error: 'APP_URL not configured' });
  }

  try {
    const stripe = new Stripe(secretKey);
    const { userId, email } = req.body as { userId?: string; email?: string };

    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing userId or email' });
    }

    const normalizedAppUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'StudyFlow AI Pro Plan',
              description: 'Unlimited PDF uploads and advanced AI features',
            },
            unit_amount: 700,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${normalizedAppUrl}?success=true`,
      cancel_url: `${normalizedAppUrl}?canceled=true`,
      client_reference_id: userId,
      customer_email: email,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Checkout session failed';
    return res.status(500).json({ error: message });
  }
}
