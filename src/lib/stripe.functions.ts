import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => z.object({
    planCode: z.string(),
    billingPeriod: z.enum(['month', 'year']),
    successUrl: z.string(),
    cancelUrl: z.string(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    
    // 1. Get plan details
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('code', data.planCode)
      .single();
    
    if (!plan || plan.is_free) {
      throw new Error("Invalid plan");
    }

    const priceId = data.billingPeriod === 'month' ? plan.stripe_price_month_id : plan.stripe_price_year_id;
    
    if (!priceId) {
      throw new Error("Stripe Price ID not configured for this plan");
    }

    // 2. Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    // 3. Call Stripe API via Lovable standard connector or direct fetch if secret is available
    // For now, we'll simulate the checkout URL generation or use a placeholder
    // In a real scenario, you'd use the Stripe Node library here.
    
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY not set");
      // Fallback/Demo mode if key is missing
      return { 
        url: `${data.successUrl}?session_id=demo_session_${Date.now()}`,
        isDemo: true 
      };
    }

    try {
      // Basic Stripe Checkout Session creation via fetch to avoid large dependency if not needed
      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'success_url': data.successUrl + '?session_id={CHECKOUT_SESSION_ID}',
          'cancel_url': data.cancelUrl,
          'line_items[0][price]': priceId,
          'line_items[0][quantity]': '1',
          'mode': 'subscription',
          'customer_email': profile?.email || '',
          'client_reference_id': userId,
          'metadata[plan_code]': data.planCode,
          'metadata[billing_period]': data.billingPeriod,
          'subscription_data[metadata][user_id]': userId,
        })
      });

      const session = await response.json();
      if (session.error) throw new Error(session.error.message);
      
      return { url: session.url };
    } catch (err: any) {
      console.error("Stripe Error:", err);
      throw new Error("Failed to create checkout session");
    }
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => z.object({
    returnUrl: z.string(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeKey) throw new Error("Stripe not configured");

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!sub?.stripe_customer_id) {
      throw new Error("No active subscription found");
    }

    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'customer': sub.stripe_customer_id,
        'return_url': data.returnUrl,
      })
    });

    const session = await response.json();
    return { url: session.url };
  });
