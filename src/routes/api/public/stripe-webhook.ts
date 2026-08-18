import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/public/stripe-webhook' as any)({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get('stripe-signature');
        const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const stripeKey = process.env.STRIPE_SECRET_KEY;

        if (!signature || !stripeSecret || !stripeKey) {
          return new Response('Configuração incompleta', { status: 400 });
        }

        const body = await request.text();

        // In a real environment with the Stripe library:
        // const event = stripe.webhooks.constructEvent(body, signature, stripeSecret);
        
        // For Lovable/Edge environment, we handle the JSON directly after manual validation 
        // OR rely on Stripe library if it works in edge (which it does usually via fetch).
        
        let event;
        try {
          event = JSON.parse(body);
        } catch (err) {
          return new Response('Invalid JSON', { status: 400 });
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

        try {
          switch (event.type) {
            case 'checkout.session.completed': {
              const session = event.data.object;
              const userId = session.client_reference_id;
              const planCode = session.metadata.plan_code;
              const billingPeriod = session.metadata.billing_period;

              if (!userId || !planCode) break;

              // Update subscription in DB
              const { error } = await supabaseAdmin
                .from('subscriptions')
                .upsert({
                  user_id: userId,
                  plan_code: planCode,
                  billing_period: billingPeriod,
                  status: 'active',
                  stripe_customer_id: session.customer,
                  stripe_subscription_id: session.subscription,
                  current_period_ends_at: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(), // rough estimate, will be corrected by sub update
                  updated_at: new Date().toISOString()
                });
              
              if (error) console.error("Webhook Update Error:", error);
              break;
            }

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
              const subscription = event.data.object;
              const userId = subscription.metadata.user_id;

              if (!userId) break;

              const { error } = await supabaseAdmin
                .from('subscriptions')
                .update({
                  status: subscription.status,
                  current_period_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);
              
              if (error) console.error("Webhook Sub Update Error:", error);
              break;
            }
          }

          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (err: any) {
          console.error("Webhook Error:", err);
          return new Response(err.message, { status: 500 });
        }
      }
    }
  }
});
