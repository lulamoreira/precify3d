import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlans } from '@/lib/quota.functions';
import { createCheckoutSession } from '@/lib/stripe.functions';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Zap, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/planos' as any)({
  component: PlansPage,
});

function PlansPage() {
  const getPlansFn = useServerFn(getPlans);
  const checkoutFn = useServerFn(createCheckoutSession);
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => getPlansFn(),
  });

  const checkoutMutation = useMutation({
    mutationFn: (planCode: string) => checkoutFn({
      planCode,
      billingPeriod,
      successUrl: `${window.location.origin}/dashboard?checkout=success`,
      cancelUrl: window.location.href,
    }),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast.error("Erro ao iniciar checkout: " + (error.message || "Tente novamente"));
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f97316]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Escolha o plano ideal para você
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Cálculos precisos para o seu negócio de impressão 3D, independente do seu volume.
        </p>

        <div className="flex items-center justify-center gap-4 mt-8">
          <span className={cn("text-sm font-medium", billingPeriod === 'month' ? "text-white" : "text-gray-500")}>Mensal</span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'month' ? 'year' : 'month')}
            className="relative w-12 h-6 rounded-full bg-[#22223a] transition-colors focus:outline-none"
          >
            <div className={cn(
              "absolute top-1 left-1 w-4 h-4 rounded-full bg-[#f97316] transition-transform",
              billingPeriod === 'year' && "translate-x-6"
            )} />
          </button>
          <span className={cn("text-sm font-medium", billingPeriod === 'year' ? "text-white" : "text-gray-500")}>
            Anual <span className="text-[#f97316] text-[10px] bg-[#f97316]/10 px-1.5 py-0.5 rounded-full font-bold ml-1">Economize ~17%</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans?.map((plan: any) => (
          <Card key={plan.id} className={cn(
            "bg-[#111128] border-[#22223a] text-white flex flex-col relative overflow-hidden transition-all hover:border-[#f97316]/50",
            plan.code === 'studio' && "ring-2 ring-[#f97316] border-[#f97316]"
          )}>
            {plan.code === 'studio' && (
              <div className="absolute top-0 right-0 bg-[#f97316] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                Recomendado
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription className="text-gray-400">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  R$ {billingPeriod === 'month' 
                    ? plan.price_month.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) 
                    : plan.price_year.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-gray-500 text-sm">/{billingPeriod === 'month' ? 'mês' : 'ano'}</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="text-[#f97316] shrink-0" size={16} />
                  <span>{plan.daily_quota ? `${plan.daily_quota} precificações/dia` : 'Precificações ilimitadas'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="text-[#f97316] shrink-0" size={16} />
                  <span>Simulação e orçamento contam igual</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="text-[#f97316] shrink-0" size={16} />
                  <span>Recalcular mesma peça não gasta crédito</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="text-[#f97316] shrink-0" size={16} />
                  <span>Créditos não acumulam</span>
                </div>
                {plan.features?.map((feature: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="text-[#f97316] shrink-0" size={16} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className={cn(
                  "w-full font-bold",
                  plan.is_free 
                    ? "bg-transparent border border-[#22223a] text-gray-400 hover:bg-[#22223a] hover:text-white" 
                    : "bg-[#f97316] hover:bg-[#d96314] text-white"
                )}
                disabled={plan.is_free}
              >
                {plan.is_free ? 'Plano Atual' : 'Começar Agora'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="bg-[#111128]/50 border border-[#22223a] rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#f97316]/10 rounded-full text-[#f97316]">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="font-bold text-white">Pagamento Seguro & Sem Fidelidade</h4>
            <p className="text-sm text-gray-400">Cancele ou mude de plano a qualquer momento. Seus dados continuam seus.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" className="text-gray-400 hover:text-white">Dúvidas?</Button>
          <Button className="bg-white text-black hover:bg-gray-200 font-bold px-8">Falar com Suporte</Button>
        </div>
      </div>
    </div>
  );
}
