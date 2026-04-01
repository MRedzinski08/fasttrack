import Stripe from 'stripe';
import pool from '../db/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function getUser(firebaseUid) {
  const result = await pool.query(
    'SELECT * FROM user_profiles WHERE firebase_uid = $1',
    [firebaseUid]
  );
  return result.rows[0];
}

export async function createCheckout(req, res) {
  try {
    const user = await getUser(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Create or reuse Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { firebaseUid: user.firebase_uid },
      });
      customerId = customer.id;
      await pool.query(
        'UPDATE user_profiles SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, user.id]
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('createCheckout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}

export async function getSubscriptionStatus(req, res) {
  try {
    const user = await getUser(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // If user has a subscription, verify with Stripe
    if (user.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
        const isActive = ['active', 'trialing'].includes(subscription.status);

        // Update local DB to match Stripe's truth
        await pool.query(
          `UPDATE user_profiles SET
            subscription_tier = $1,
            subscription_status = $2,
            subscription_end_date = $3
           WHERE id = $4`,
          [
            isActive ? 'pro' : 'free',
            subscription.status,
            new Date(subscription.current_period_end * 1000),
            user.id,
          ]
        );

        return res.json({
          tier: isActive ? 'pro' : 'free',
          status: subscription.status,
          endDate: new Date(subscription.current_period_end * 1000),
        });
      } catch {
        // Subscription not found in Stripe, reset locally
        await pool.query(
          `UPDATE user_profiles SET subscription_tier = 'free', subscription_status = 'none' WHERE id = $1`,
          [user.id]
        );
      }
    }

    res.json({
      tier: user.subscription_tier || 'free',
      status: user.subscription_status || 'none',
      endDate: user.subscription_end_date,
    });
  } catch (err) {
    console.error('getSubscriptionStatus error:', err);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
}

export async function handleCheckoutSuccess(req, res) {
  // Called after user returns from Stripe checkout
  // Verify the session and update the user's subscription
  const { sessionId } = req.body;
  try {
    const user = await getUser(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (session.payment_status === 'paid' && session.subscription) {
      const sub = typeof session.subscription === 'string'
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription;

      await pool.query(
        `UPDATE user_profiles SET
          subscription_tier = 'pro',
          stripe_subscription_id = $1,
          subscription_status = $2,
          subscription_end_date = $3
         WHERE id = $4`,
        [
          sub.id,
          sub.status,
          new Date(sub.current_period_end * 1000),
          user.id,
        ]
      );

      return res.json({ tier: 'pro', status: sub.status });
    }

    res.json({ tier: 'free', status: 'incomplete' });
  } catch (err) {
    console.error('handleCheckoutSuccess error:', err);
    res.status(500).json({ error: 'Failed to verify checkout' });
  }
}

export async function cancelSubscription(req, res) {
  try {
    const user = await getUser(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.stripe_subscription_id) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    // Cancel at period end (user keeps access until end of billing cycle)
    const subscription = await stripe.subscriptions.update(user.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    await pool.query(
      `UPDATE user_profiles SET subscription_status = $1 WHERE id = $2`,
      ['canceling', user.id]
    );

    res.json({
      status: 'canceling',
      endDate: new Date(subscription.current_period_end * 1000),
    });
  } catch (err) {
    console.error('cancelSubscription error:', err);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}
