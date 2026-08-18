import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getCoupons, createCoupon, toggleCouponActive } from '@/lib/admin-plans.functions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Loader2, Ticket, Calendar, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/_authenticated/admin/cupons')({
  component: AdminCouponsPage,
});

function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const getCouponsFn = useServerFn(getCoupons);
  const createCouponFn = useServerFn(createCoupon);
  const toggleActiveFn = useServerFn(toggleCouponActive);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [duration, setDuration] = useState<'once' | 'repeating' | 'forever'>('once');

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['coupons', 'admin'],
    queryFn: () => getCouponsFn(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createCouponFn({ data }),
    onSuccess: () => {
      toast.success("Cupom e Código de Promoção criados no Stripe e no Banco!");
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar cupom");
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleActiveFn({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success("Status do cupom atualizado!");
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: any = {
      code: (formData.get('code') as string).toUpperCase().trim(),
      description: formData.get('description'),
      discount_type: discountType,
      discount_value: Number(formData.get('discount_value')),
      duration: duration,
      duration_months: duration === 'repeating' ? Number(formData.get('duration_months')) : null,
      max_redemptions: formData.get('max_redemptions') ? Number(formData.get('max_redemptions')) : null,
      expires_at: formData.get('expires_at') || null,
      plan_codes: null, // Simplificado por enquanto
    };

    createMutation.mutate(data);
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#f97316]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Gestão de Cupons</h2>
        <Button onClick={() => setIsFormOpen(true)} className="bg-[#f97316] hover:bg-[#d96314]">
          <Plus className="mr-2 h-4 w-4" /> Criar Cupom
        </Button>
      </div>

      <Card className="bg-[#111128] border-[#22223a]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#22223a] hover:bg-transparent">
                <TableHead className="text-gray-400">Código</TableHead>
                <TableHead className="text-gray-400">Desconto</TableHead>
                <TableHead className="text-gray-400">Duração</TableHead>
                <TableHead className="text-gray-400">Usos</TableHead>
                <TableHead className="text-gray-400">Expira em</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-right text-gray-400">Ativo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons?.map((coupon: any) => (
                <TableRow key={coupon.id} className="border-[#22223a] hover:bg-[#1a1a35]">
                  <TableCell className="font-mono font-bold text-[#f97316]">{coupon.code}</TableCell>
                  <TableCell className="text-gray-300">
                    {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `R$ ${coupon.discount_value}`}
                  </TableCell>
                  <TableCell className="text-gray-400 text-xs">
                    {coupon.duration === 'once' ? 'Uma vez' : coupon.duration === 'forever' ? 'Para sempre' : `${coupon.duration_months} meses`}
                  </TableCell>
                  <TableCell className="text-gray-400 text-xs">
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      {coupon.times_redeemed} / {coupon.max_redemptions || '∞'}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400 text-xs">
                    {coupon.expires_at ? format(new Date(coupon.expires_at), "dd/MM/yy", { locale: ptBR }) : 'Nunca'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={coupon.active ? "default" : "secondary"} className={coupon.active ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}>
                      {coupon.active ? "Válido" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch 
                      checked={coupon.active} 
                      onCheckedChange={() => toggleMutation.mutate(coupon.id)}
                      disabled={toggleMutation.isPending}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-[#111128] border-[#22223a] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="text-[#f97316]" /> Novo Cupom
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Crie um código de desconto que será sincronizado com o Stripe.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código do Cupom</Label>
              <Input id="code" name="code" placeholder="EX: TRINTAOFF" required className="bg-[#07071a] border-[#22223a] uppercase" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Desconto</Label>
                <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                  <SelectTrigger className="bg-[#07071a] border-[#22223a]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111128] border-[#22223a] text-white">
                    <SelectItem value="percent">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_value">Valor</Label>
                <Input id="discount_value" name="discount_value" type="number" step="0.01" required className="bg-[#07071a] border-[#22223a]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duração</Label>
                <Select value={duration} onValueChange={(v: any) => setDuration(v)}>
                  <SelectTrigger className="bg-[#07071a] border-[#22223a]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111128] border-[#22223a] text-white">
                    <SelectItem value="once">Apenas 1º mês</SelectItem>
                    <SelectItem value="repeating">N meses</SelectItem>
                    <SelectItem value="forever">Para sempre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {duration === 'repeating' && (
                <div className="space-y-2">
                  <Label htmlFor="duration_months">Nº de Meses</Label>
                  <Input id="duration_months" name="duration_months" type="number" required className="bg-[#07071a] border-[#22223a]" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_redemptions">Limite de Usos</Label>
                <Input id="max_redemptions" name="max_redemptions" type="number" placeholder="Ilimitado" className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires_at">Data de Expiração</Label>
                <Input id="expires_at" name="expires_at" type="date" className="bg-[#07071a] border-[#22223a]" />
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded text-[11px] text-amber-200">
              <p className="font-bold flex items-center gap-1 mb-1">
                <Calendar size={12} /> Nota sobre o Stripe:
              </p>
              Cupons criados em modo teste só funcionam em checkouts de teste. O código promocional será idêntico ao código do cupom.
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} className="text-gray-400">Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-[#f97316] hover:bg-[#d96314]">
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Criar Cupom'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
