import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getPlans } from '@/lib/quota.functions';
import { createPlan, updatePlan, deletePlan, reorderPlans } from '@/lib/admin-plans.functions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, GripVertical, AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/admin/planos')({
  component: AdminPlansPage,
});

function AdminPlansPage() {
  const queryClient = useQueryClient();
  const getPlansFn = useServerFn(getPlans);
  const createPlanFn = useServerFn(createPlan);
  const updatePlanFn = useServerFn(updatePlan);
  const deletePlanFn = useServerFn(deletePlan);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<any>(null);
  const [isPriceChangeConfirmOpen, setIsPriceChangeConfirmOpen] = useState(false);
  const [pendingUpdateData, setPendingUpdateData] = useState<any>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans', 'admin'],
    queryFn: () => getPlansFn(),
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setIsFormOpen(false);
      setEditingPlan(null);
      setPendingUpdateData(null);
      setIsPriceChangeConfirmOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro na operação");
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => createPlanFn({ data }),
    ...mutationOptions,
    onSuccess: () => {
      toast.success("Plano criado com sucesso!");
      mutationOptions.onSuccess();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updatePlanFn({ data }),
    ...mutationOptions,
    onSuccess: () => {
      toast.success("Plano atualizado!");
      mutationOptions.onSuccess();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePlanFn({ data: id }),
    ...mutationOptions,
    onSuccess: () => {
      toast.success("Plano excluído!");
      setIsDeleteDialogOpen(false);
      mutationOptions.onSuccess();
    }
  });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      name: formData.get('name'),
      description: formData.get('description'),
      code: editingPlan ? editingPlan.code : formData.get('code'),
      daily_quota: formData.get('unlimited_quota') === 'on' ? null : Number(formData.get('daily_quota')),
      price_month: Number(formData.get('price_month')),
      price_year: Number(formData.get('price_year')),
      trial_days: Number(formData.get('trial_days')),
      active: formData.get('active') === 'on',
      features: (formData.get('features') as string).split('\n').filter(f => f.trim()),
      is_free: formData.get('is_free') === 'on',
    };

    if (editingPlan) {
      data.id = editingPlan.id;
      // Check for price changes (Parte C-b)
      const priceChanged = data.price_month !== editingPlan.price_month || data.price_year !== editingPlan.price_year;
      
      if (priceChanged && !editingPlan.is_free) {
        setPendingUpdateData(data);
        setIsPriceChangeConfirmOpen(true);
      } else {
        updateMutation.mutate(data);
      }
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#f97316]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Gestão de Planos</h2>
        <Button onClick={() => { setEditingPlan(null); setIsFormOpen(true); }} className="bg-[#f97316] hover:bg-[#d96314]">
          <Plus className="mr-2 h-4 w-4" /> Criar Plano
        </Button>
      </div>

      <Card className="bg-[#111128] border-[#22223a]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#22223a] hover:bg-transparent">
                <TableHead className="w-10"></TableHead>
                <TableHead className="text-gray-400">Nome</TableHead>
                <TableHead className="text-gray-400">Código</TableHead>
                <TableHead className="text-gray-400">Créditos/Dia</TableHead>
                <TableHead className="text-gray-400">Preço (M/A)</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-right text-gray-400">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans?.map((plan: any) => (
                <TableRow key={plan.id} className="border-[#22223a] hover:bg-[#1a1a35]">
                  <TableCell><GripVertical className="text-gray-600 cursor-move" size={16} /></TableCell>
                  <TableCell className="font-medium text-white">
                    {plan.name}
                    {plan.is_free && <Badge className="ml-2 bg-blue-500/10 text-blue-400 border-blue-500/20">Free</Badge>}
                  </TableCell>
                  <TableCell className="text-gray-400 font-mono text-xs">{plan.code}</TableCell>
                  <TableCell className="text-gray-300">
                    {plan.daily_quota === null ? 'Ilimitado' : plan.daily_quota}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    R$ {plan.price_month}/m · R$ {plan.price_year}/a
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.active ? "default" : "secondary"} className={plan.active ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}>
                      {plan.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingPlan(plan); setIsFormOpen(true); }} className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                      <Edit2 size={16} />
                    </Button>
                    {!plan.is_free && (
                      <Button variant="ghost" size="icon" onClick={() => { setPlanToDelete(plan); setIsDeleteDialogOpen(true); }} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-[#111128] border-[#22223a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingPlan ? `Editando configurações do plano ${editingPlan.code}` : 'Configure os detalhes do novo plano de assinatura.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano</Label>
                <Input id="name" name="name" defaultValue={editingPlan?.name} required className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código (Slug)</Label>
                <Input id="code" name="code" defaultValue={editingPlan?.code} disabled={!!editingPlan} required className="bg-[#07071a] border-[#22223a]" placeholder="ex: plus-anual" />
                {editingPlan && <p className="text-[10px] text-gray-500">O código não pode ser alterado após a criação.</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input id="description" name="description" defaultValue={editingPlan?.description} className="bg-[#07071a] border-[#22223a]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="daily_quota">Créditos por Dia</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox id="unlimited_quota" name="unlimited_quota" defaultChecked={editingPlan?.daily_quota === null} />
                    <Label htmlFor="unlimited_quota" className="text-xs text-gray-400">Ilimitado</Label>
                  </div>
                </div>
                <Input id="daily_quota" name="daily_quota" type="number" defaultValue={editingPlan?.daily_quota || 0} className="bg-[#07071a] border-[#22223a]" />
                {editingPlan && <p className="text-[10px] text-amber-500">Alterar isso afeta todos os usuários do plano imediatamente.</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="trial_days">Dias de Trial</Label>
                <Input id="trial_days" name="trial_days" type="number" defaultValue={editingPlan?.trial_days || 0} className="bg-[#07071a] border-[#22223a]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_month">Preço Mensal (R$)</Label>
                <Input id="price_month" name="price_month" type="number" step="0.01" defaultValue={editingPlan?.price_month} required className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_year">Preço Anual (R$)</Label>
                <Input id="price_year" name="price_year" type="number" step="0.01" defaultValue={editingPlan?.price_year} required className="bg-[#07071a] border-[#22223a]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Recursos (um por linha)</Label>
              <Textarea id="features" name="features" rows={4} defaultValue={editingPlan?.features?.join('\n')} className="bg-[#07071a] border-[#22223a]" />
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Checkbox id="active" name="active" defaultChecked={editingPlan ? editingPlan.active : true} />
                <Label htmlFor="active">Ativo (visível para novos assinantes)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="is_free" name="is_free" defaultChecked={editingPlan?.is_free} disabled={editingPlan?.is_free} />
                <Label htmlFor="is_free">Plano Gratuito (Master)</Label>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} className="text-gray-400">Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#f97316] hover:bg-[#d96314]">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#111128] border-[#22223a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Plano?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta ação é irreversível. O plano só pode ser excluído se não houver NENHUM assinante histórico.
              Recomendamos desativar o plano em vez de excluí-lo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[#22223a] text-gray-400">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(planToDelete.id)} className="bg-red-500 hover:bg-red-600">
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Price Change Confirmation (Parte C-b) */}
      <AlertDialog open={isPriceChangeConfirmOpen} onOpenChange={setIsPriceChangeConfirmOpen}>
        <AlertDialogContent className="bg-[#111128] border-[#22223a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500" /> Alteração de Preço
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 space-y-4">
              <p>Você está alterando o preço de um plano pago. No Stripe, preços são imutáveis.</p>
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg text-amber-200 text-sm">
                <strong>O que acontecerá:</strong>
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  <li>Um novo preço será criado no Stripe.</li>
                  <li>Novos assinantes pagarão o novo valor.</li>
                  <li>Assinantes atuais continuarão no preço antigo (R$ {editingPlan?.price_month}) por padrão.</li>
                </ul>
              </div>
              <p className="font-bold text-white pt-2">Deseja prosseguir com a atualização?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingUpdateData(null)} className="bg-transparent border-[#22223a] text-gray-400">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => updateMutation.mutate(pendingUpdateData)} className="bg-[#f97316] hover:bg-[#d96314]">
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Atualizar Preços'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
