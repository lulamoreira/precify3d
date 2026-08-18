import { createFileRoute } from '@tanstack/react-router';
import Stripe from 'stripe';

export const Route = createFileRoute('/api/public/stripe-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get('stripe-signature');
        const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const stripeKey = process.env.STRIPE_SECRET_KEY;

        if (!signature || !stripeSecret || !stripeKey) {
          console.error("Configuração de Webhook incompleta");
          return new Response('Configuração incompleta', { status: 400 });
        }

        const body = await request.text();

        const stripe = new Stripe(stripeKey, {
          httpClient: Stripe.createFetchHttpClient(),
        });

        const cryptoProvider = Stripe.createSubtleCryptoProvider();

        let event;
        try {
          event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            stripeSecret,
            undefined,
            cryptoProvider
          );
        } catch (err) {
          console.error("Assinatura de Webhook inválida");
          return new Response('Assinatura inválida', { status: 400 });
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

        try {
          switch (event.type) {
            case 'checkout.session.completed': {
              const session = event.data.object as Stripe.Checkout.Session;
              const userId = session.client_reference_id;
              const planCode = session.metadata?.plan_code;
              const billingPeriod = session.metadata?.billing_period;

              if (!userId || !planCode) break;

              // Update subscription in DB
              const { error } = await supabaseAdmin
                .from('subscriptions')
                .upsert({
                  user_id: userId,
                  plan_code: planCode,
                  billing_period: billingPeriod,
                  status: 'active',
                  stripe_customer_id: session.customer as string,
                  stripe_subscription_id: session.subscription as string,
                  current_period_ends_at: null, // Deixando null para ser preenchido pelo evento de sub.updated
                  updated_at: new Date().toISOString()
                });
              
              if (error) console.error("Webhook Update Error:", error);
              break;
            }

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
              const subscription = event.data.object as Stripe.Subscription;
              const userId = subscription.metadata?.user_id;

              if (!userId) break;

              const { error } = await supabaseAdmin
                .from('subscriptions')
                .update({
                  status: subscription.status,
                  current_period_ends_at: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : new Date().toISOString(),
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
          console.error("Webhook Business Logic Error:", err);
          return new Response('Internal Server Error', { status: 500 });
        }
      }
    }
  }
});
