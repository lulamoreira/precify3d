import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserSettings, updateUserSettings, getMaterials, addMaterial, deleteMaterial } from '@/lib/data.functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Zap, DollarSign, Trash2, Plus, Info, CheckCircle2, Loader2, Package, Calculator, Gauge, ShieldCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useServerFn } from '@tanstack/react-start';


export const Route = createFileRoute('/_authenticated/configuracoes')({
  component: SettingsPage,
});


function SettingsPage() {
  const queryClient = useQueryClient();
  const updateSettingsFn = useServerFn(updateUserSettings);
  const addMaterialFn = useServerFn(addMaterial);
  const deleteMaterialFn = useServerFn(deleteMaterial);

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => getUserSettings(),
  });

  const { data: materials, isLoading: loadingMaterials } = useQuery({
    queryKey: ['materials'],
    queryFn: () => getMaterials(),
  });

  const [form, setForm] = useState<any>(null);
  const [newMaterial, setNewMaterial] = useState({ name: '', price_per_kg: '', color: '#f97316' });

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { id, user_id, created_at, updated_at, ...cleanSettings } = form;
      await updateSettingsFn({ data: cleanSettings });
      toast.success('Configurações atualizadas!');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch (err: any) {
      toast.error('Erro ao atualizar: ' + err.message);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.name || !newMaterial.price_per_kg) return;
    try {
      await addMaterialFn({ data: { ...newMaterial, price_per_kg: Number(newMaterial.price_per_kg) } });
      toast.success('Material adicionado!');
      setNewMaterial({ name: '', price_per_kg: '', color: '#f97316' });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    } catch (err: any) {
      toast.error('Erro ao adicionar: ' + err.message);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Excluir este material?')) return;
    try {
      await deleteMaterialFn({ data: id });
      toast.success('Material removido.');
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + err.message);
    }
  };

  if (loadingSettings || !form) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#f97316]" size={48} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-gray-400">Personalize os custos e padrões da sua precificadora.</p>
      </div>

      <form onSubmit={handleUpdateSettings} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap size={18} className="text-[#f97316]" />
                Energia Elétrica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Custo kWh (R$)</Label>
                <Input type="number" step="0.01" value={form.kwh} onChange={e => setForm({...form, kwh: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label>Potência da Impressora (W)</Label>
                <Input type="number" value={form.watt} onChange={e => setForm({...form, watt: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign size={18} className="text-[#f97316]" />
                Mão de Obra & Máquina
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Custo/Hora Mão de Obra (R$/h)</Label>
                <Input type="number" step="0.01" value={form.labor} onChange={e => setForm({...form, labor: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label>Desgaste da Máquina (R$/h)</Label>
                <Input type="number" step="0.01" value={form.machine} onChange={e => setForm({...form, machine: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 size={18} className="text-[#f97316]" />
                Padrões de Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Margem (%)</Label>
                <Input type="number" value={form.margin} onChange={e => setForm({...form, margin: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label>Falha (%)</Label>
                <Input type="number" value={form.failure} onChange={e => setForm({...form, failure: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label>Embalagem (R$)</Label>
                <Input type="number" step="0.01" value={form.packaging} onChange={e => setForm({...form, packaging: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label>Taxa Plataforma (%)</Label>
                <Input type="number" step="0.01" value={form.platform_fee} onChange={e => setForm({...form, platform_fee: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="flex justify-end">
          <Button type="submit" className="bg-[#f97316] hover:bg-[#d96314] px-8 rounded-xl">Salvar Alterações</Button>
        </div>
      </form>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Package className="text-[#f97316]" size={24} />
          Gerenciar Materiais
        </h2>
        
        <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Novo Material</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMaterial} className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label>Nome do Material</Label>
                <Input placeholder="Ex: PLA Wood" value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2 w-32">
                <Label>Preço/kg (R$)</Label>
                <Input type="number" value={newMaterial.price_per_kg} onChange={e => setNewMaterial({...newMaterial, price_per_kg: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Input type="color" value={newMaterial.color} onChange={e => setNewMaterial({...newMaterial, color: e.target.value})} className="w-16 h-10 p-1 bg-[#07071a] border-[#22223a]" />
              </div>
              <Button type="submit" className="bg-[#f97316] hover:bg-[#d96314] gap-2 rounded-xl">
                <Plus size={18} />
                Adicionar
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-[#22223a] hover:bg-transparent">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="text-gray-400">Material</TableHead>
                  <TableHead className="text-gray-400">Preço por kg</TableHead>
                  <TableHead className="text-gray-400 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials?.map((mat) => (
                  <TableRow key={mat.id} className="border-[#22223a] hover:bg-[#22223a]/50">
                    <TableCell>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mat.color }} />
                    </TableCell>
                    <TableCell className="font-medium">{mat.name}</TableCell>
                    <TableCell>R$ {Number(mat.price_per_kg).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-500 hover:bg-red-500/10" onClick={() => handleDeleteMaterial(mat.id)}>
                        <Trash2 size={18} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 p-4 bg-[#f97316]/10 border border-[#f97316]/20 rounded-xl text-[#f97316] text-sm">
        <Info size={16} />
        <p>As alterações feitas aqui serão aplicadas automaticamente aos seus próximos cálculos.</p>
      </div>
    </div>
  );
}
