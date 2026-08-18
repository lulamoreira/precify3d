import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserSettings, updateUserSettings, getMaterials, addMaterial, deleteMaterial, getPrinterPresets, getEnergyTariffs } from '@/lib/data.functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useState, useEffect, useMemo } from 'react';
import { Zap, DollarSign, Trash2, Plus, Info, CheckCircle2, Loader2, Package, Calculator, Gauge, ShieldCheck, Maximize, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useServerFn } from '@tanstack/react-start';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";



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
  const [showPresetAlert, setShowPresetAlert] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<any>(null);

  const { data: presets } = useQuery({ queryKey: ['presets'], queryFn: () => getPrinterPresets() });
  const { data: tariffs } = useQuery({ queryKey: ['tariffs'], queryFn: () => getEnergyTariffs() });


  const printerPresets = [
    { name: 'Bambu A1 mini', x: 180, y: 180, z: 180 },
    { name: 'Bambu A1-P1S-X1C', x: 256, y: 256, z: 256 },
    { name: 'Ender 3', x: 220, y: 220, z: 250 },
    { name: 'Prusa MK4', x: 250, y: 210, z: 220 },
    { name: 'Personalizado', x: 200, y: 200, z: 200 }
  ];

  useEffect(() => {
    if (settings) {
      setForm({
        ...settings,
        engine_version: settings.engine_version || 'v1',
        tax_pct: settings.tax_pct?.toString() || '0',
        setup_minutes: settings.setup_minutes?.toString() || '15',
        post_processing_price_hour: settings.post_processing_price_hour?.toString() || '0',
        layer_height: settings.layer_height?.toString() || '0.2',
        nozzle_width: settings.nozzle_width?.toString() || '0.4',
        walls: settings.walls?.toString() || '3',
        volumetric_rate: settings.volumetric_rate?.toString() || '8.0',
        time_calibration: settings.time_calibration?.toString() || '1.0',
        store_files: settings.store_files ?? true,
        bed_x: (settings as any).bed_x || 256,
        bed_y: (settings as any).bed_y || 256,
        bed_z: (settings as any).bed_z || 256,
        plate_margin: (settings as any).plate_margin || 5,
        part_gap: (settings as any).part_gap || 8,
        batch_travel_seconds: (settings as any).batch_travel_seconds || 2,
        plate_waste_g: (settings as any).plate_waste_g || 5,
        batch_kills_plate: (settings as any).batch_kills_plate ?? true,
        batch_loss_factor: (settings as any).batch_loss_factor || 0.6,
        fixed_time_share: settings.fixed_time_share || 0.15,
        hours_per_day: settings.hours_per_day || 20

      });
    }
  }, [settings]);

  const applyPreset = (preset: any) => {
    if (preset.name === 'Personalizado') return;
    setForm({
      ...form,
      bed_x: preset.x,
      bed_y: preset.y,
      bed_z: preset.z
    });
  };

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
        <Tabs defaultValue="costs" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#111128] border border-[#22223a] rounded-xl p-1 mb-8">
            <TabsTrigger value="costs" className="rounded-lg data-[state=active]:bg-[#f97316] data-[state=active]:text-white">Custos & Padrões</TabsTrigger>
            <TabsTrigger value="technical" className="rounded-lg data-[state=active]:bg-[#f97316] data-[state=active]:text-white">Impressão & Impostos</TabsTrigger>
          </TabsList>

          <TabsContent value="costs" className="space-y-6 animate-fadeIn">
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
                    <Label>Estado / Região</Label>
                    <Select value={form.energy_uf || 'manual'} onValueChange={(val) => {
                      if (val === 'manual') {
                        setForm({...form, energy_uf: null});
                      } else {
                        const tariff = tariffs?.find(t => t.uf === val);
                        if (tariff) setForm({...form, energy_uf: val, kwh: tariff.price_kwh.toString()});
                      }
                    }}>
                      <SelectTrigger className="bg-[#07071a] border-[#22223a]">
                        <SelectValue placeholder="Selecione um estado" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111128] border-[#22223a] text-white">
                        <SelectItem value="manual">Digitar manualmente</SelectItem>
                        <SelectGroup>
                          <SelectLabel>Estados</SelectLabel>
                          {tariffs?.map(t => <SelectItem key={t.uf} value={t.uf}>{t.state_name} ({t.uf})</SelectItem>)}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Custo kWh (R$)</Label>
                    <Input type="number" step="0.01" value={form.kwh} onChange={e => setForm({...form, kwh: e.target.value, energy_uf: null})} className="bg-[#07071a] border-[#22223a]" />
                    {form.energy_uf && <p className="text-[10px] text-gray-500">Referência de mar/2026 — sua distribuidora pode cobrar diferente.</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Impressora</Label>
                    <Select value={form.printer_preset_id || 'manual'} onValueChange={(val) => {
                      if (val === 'manual') {
                        setForm({...form, printer_preset_id: null});
                      } else {
                        const preset = presets?.find(p => p.id === val);
                        if (preset) {
                          setPendingPreset(preset);
                          setShowPresetAlert(true);
                        }
                      }
                    }}>
                      <SelectTrigger className="bg-[#07071a] border-[#22223a]">
                        <SelectValue placeholder="Selecione um modelo" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111128] border-[#22223a] text-white">
                        <SelectItem value="manual">Outra / Digitar manualmente</SelectItem>
                        {Array.from(new Set(presets?.map(p => p.brand))).map(brand => (
                          <SelectGroup key={brand}>
                            <SelectLabel>{brand}</SelectLabel>
                            {presets?.filter(p => p.brand === brand).map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.model} {p.is_estimated && <Badge variant="outline" className="ml-2 bg-amber-500/20 text-amber-500 border-amber-500/30 text-[9px]">estimado</Badge>}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Potência da Impressora (W)</Label>
                    <Input type="number" value={form.watt} onChange={e => setForm({...form, watt: e.target.value, printer_preset_id: null})} className="bg-[#07071a] border-[#22223a]" />
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
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Fração Tempo Fixo (0-1)</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info size={14} className="text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>Percentual do tempo de placa que é fixo (setup/aquecimento)</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input type="number" step="0.01" value={form.fixed_time_share} onChange={e => setForm({...form, fixed_time_share: Number(e.target.value)})} className="bg-[#07071a] border-[#22223a]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Horas/Dia de Impressão</Label>
                    <Input type="number" value={form.hours_per_day} onChange={e => setForm({...form, hours_per_day: Number(e.target.value)})} className="bg-[#07071a] border-[#22223a]" />
                  </div>
                </CardContent>

              </Card>
            </div>
          </TabsContent>

          <TabsContent value="technical" className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calculator size={18} className="text-[#f97316]" />
                    Motor V2 & Impostos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-3 bg-[#07071a] border border-[#22223a] rounded-xl">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Motor V2 (Ativo por Padrão)</Label>
                      <p className="text-[10px] text-gray-500">Usa lógica de Gross-up em todos os orçamentos</p>
                    </div>
                    <Switch checked={form.engine_version === 'v2'} onCheckedChange={checked => setForm({...form, engine_version: checked ? 'v2' : 'v1'})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Alíquota de Imposto (%)</Label>
                    <Input type="number" step="0.1" value={form.tax_pct} onChange={e => setForm({...form, tax_pct: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Custo Pós-Processamento (R$/h)</Label>
                    <Input type="number" step="0.1" value={form.post_processing_price_hour} onChange={e => setForm({...form, post_processing_price_hour: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tempo de Setup Fixo (min)</Label>
                    <Input type="number" value={form.setup_minutes} onChange={e => setForm({...form, setup_minutes: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#07071a] border border-[#22223a] rounded-xl">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Guardar arquivos 3D na nuvem</Label>
                      <p className="text-[10px] text-gray-500">Faz upload automático de STL/G-code para o servidor</p>
                    </div>
                    <Switch checked={form.store_files} onCheckedChange={checked => setForm({...form, store_files: checked})} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Gauge size={18} className="text-[#f97316]" />
                    Estimativa Técnica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Camada (mm)</Label>
                      <Input type="number" step="0.01" value={form.layer_height} onChange={e => setForm({...form, layer_height: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
                    </div>
                    <div className="space-y-2">
                      <Label>Bico (mm)</Label>
                      <Input type="number" step="0.1" value={form.nozzle_width} onChange={e => setForm({...form, nozzle_width: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
                    </div>
                    <div className="space-y-2">
                      <Label>Paredes (Qtd)</Label>
                      <Input type="number" value={form.walls} onChange={e => setForm({...form, walls: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
                    </div>
                    <div className="space-y-2">
                      <Label>Taxa Vol. (mm³/s)</Label>
                      <Input type="number" step="0.1" value={form.volumetric_rate} onChange={e => setForm({...form, volumetric_rate: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Calibração de Tempo (1.0 = 100%)</Label>
                    <Input type="number" step="0.01" value={form.time_calibration} onChange={e => setForm({...form, time_calibration: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Maximize size={18} className="text-[#f97316]" />
                    Minha Impressora / Mesa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {printerPresets.map(preset => (
                      <Button
                        key={preset.name}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="bg-[#07071a] border-[#22223a] hover:bg-[#22223a] text-xs"
                        onClick={() => applyPreset(preset)}
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Mesa X (mm)</Label>
                      <Input type="number" value={form.bed_x} onChange={e => setForm({...form, bed_x: Number(e.target.value)})} className="bg-[#07071a] border-[#22223a]" />
                    </div>
                    <div className="space-y-2">
                      <Label>Mesa Y (mm)</Label>
                      <Input type="number" value={form.bed_y} onChange={e => setForm({...form, bed_y: Number(e.target.value)})} className="bg-[#07071a] border-[#22223a]" />
                    </div>
                    <div className="space-y-2">
                      <Label>Mesa Z (mm)</Label>
                      <Input type="number" value={form.bed_z} onChange={e => setForm({...form, bed_z: Number(e.target.value)})} className="bg-[#07071a] border-[#22223a]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label>Margem da Mesa (mm)</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info size={14} className="text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>Espaço de segurança nas bordas da mesa</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input type="number" value={form.plate_margin} onChange={e => setForm({...form, plate_margin: Number(e.target.value)})} className="bg-[#07071a] border-[#22223a]" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label>Espaçamento entre Peças (mm)</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info size={14} className="text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>Gap mínimo entre cada objeto no lote</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input type="number" value={form.part_gap} onChange={e => setForm({...form, part_gap: Number(e.target.value)})} className="bg-[#07071a] border-[#22223a]" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label>Desperdício por Mesa (g)</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info size={14} className="text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>Purga, skirt e material perdido ao iniciar uma mesa</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input type="number" value={form.plate_waste_g} onChange={e => setForm({...form, plate_waste_g: Number(e.target.value)})} className="bg-[#07071a] border-[#22223a]" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-[#07071a] border border-[#22223a] rounded-xl">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Falha derruba a mesa?</Label>
                          <p className="text-[10px] text-gray-500">Se uma peça soltar, você costuma perder o lote todo?</p>
                        </div>
                        <Switch checked={form.batch_kills_plate} onCheckedChange={checked => setForm({...form, batch_kills_plate: checked})} />
                      </div>

                      <div className="space-y-4 p-3 bg-[#07071a] border border-[#22223a] rounded-xl">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <Label className="text-sm">Fator de Perda em Falha</Label>
                            <span className="text-xs text-[#f97316] font-mono">{(form.batch_loss_factor * 100).toFixed(0)}%</span>
                          </div>
                          <p className="text-[10px] text-gray-500">Quanto do tempo/material da mesa se perde em caso de falha</p>
                        </div>
                        <Slider 
                          value={[form.batch_loss_factor]} 
                          min={0} 
                          max={1} 
                          step={0.1} 
                          onValueChange={([val]) => setForm({...form, batch_loss_factor: val})} 
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label>Tempo de Viagem entre Peças (s)</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info size={14} className="text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>Segundos extras por camada para cada peça adicional (Modo Simultâneo)</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input type="number" value={form.batch_travel_seconds} onChange={e => setForm({...form, batch_travel_seconds: Number(e.target.value)})} className="bg-[#07071a] border-[#22223a]" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
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
