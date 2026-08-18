import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMaterials, getUserSettings, saveQuote } from '@/lib/data.functions';
import { getClients, saveFullQuote } from '@/lib/quotes.functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { parseSTLBuffer, analyzeTriangles, calcWeightFromSTL, getMaterialDensity, parseGCode, estimateWeightV2, estimateTimeHours, type STLData } from '@/lib/stl-utils';
import { calculatePricing, calculatePricingV2, type PricingResult } from '@/lib/pricing-utils';
import { Upload, Zap, Info, ExternalLink, Package, ShoppingCart, Store, CheckCircle2, Loader2, Calculator as CalculatorIcon, Layers, Maximize, Clock, Percent, AlertTriangle, Save, FileText, Plus, UserPlus, Trash2, GripVertical } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import * as fflate from 'fflate';
import { useServerFn } from '@tanstack/react-start';

export const Route = createFileRoute('/_authenticated/calculadora')({
  component: CalculatorPage,
});

function CalculatorPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const getMaterialsFn = useServerFn(getMaterials);
  const getUserSettingsFn = useServerFn(getUserSettings);
  const getClientsFn = useServerFn(getClients);
  const saveFullQuoteFn = useServerFn(saveFullQuote);

  const { data: materials } = useQuery({ queryKey: ['materials'], queryFn: () => getMaterialsFn() });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => getUserSettingsFn() });
  const { data: clientsData } = useQuery({ queryKey: ['clients'], queryFn: () => getClientsFn() });
  const clients = clientsData?.data || [];

  const [form, setForm] = useState({
    client: '',
    project: '',
    materialId: '',
    weightG: '',
    h: '',
    m: '',
    failurePct: '',
    marginPct: '',
    discountPct: '0',
    packaging: '',
    platformFee: '',
    platformName: 'none',
    notes: '',
    quantity: '1',
    taxPct: '',
    setupMinutes: '',
    postProcessingPriceHour: '',
    postProcessingMinutes: '',
    useV2: false,
    clientId: '',
    validUntil: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
    deliveryDays: '7',
    paymentTerms: '50% entrada, 50% entrega',
    shippingPrice: '0',
    publicNotes: '',
    title: ''
  });

  const [items, setItems] = useState<any[]>([]);

  const [stlData, setStlData] = useState<STLData | null>(null);
  const [stlLoading, setStlLoading] = useState(false);
  const [stlFileName, setStlFileName] = useState('');
  const [infill, setInfill] = useState(20);
  const [result, setResult] = useState<PricingResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMat = materials?.find((m: any) => m.id === form.materialId);
  const density = currentMat ? getMaterialDensity(currentMat.name) : 1.24;

  useEffect(() => {
    if (settings && !form.materialId) {
      setForm(f => ({
        ...f,
        materialId: materials?.[0]?.id || '',
        failurePct: settings.failure.toString(),
        marginPct: settings.margin.toString(),
        packaging: settings.packaging.toString(),
        platformFee: settings.platform_fee.toString(),
        taxPct: settings.tax_pct?.toString() || '0',
        setupMinutes: settings.setup_minutes?.toString() || '15',
        postProcessingPriceHour: settings.post_processing_price_hour?.toString() || '0',
        useV2: settings.engine_version === 'v2'
      }));
    }
  }, [settings, materials]);

  useEffect(() => {
    if (stlData) {
      let weight = 0;
      if (form.useV2 && settings) {
        weight = estimateWeightV2(
          stlData, 
          density, 
          infill, 
          settings.walls || 3, 
          settings.layer_height || 0.2, 
          settings.nozzle_width || 0.4
        );
        
        const time = estimateTimeHours(stlData.volCm3, settings.volumetric_rate || 8, settings.time_calibration || 1.0);
        const h = Math.floor(time);
        const m = Math.round((time - h) * 60);
        setForm(f => ({ ...f, weightG: weight.toString(), h: h.toString(), m: m.toString() }));
      } else {
        weight = calcWeightFromSTL(stlData.volCm3, density, infill);
        setForm(f => ({ ...f, weightG: weight.toString() }));
      }
    }
  }, [stlData, infill, density, form.useV2, settings]);

  const handleFile = async (file: File) => {
    const ext = file.name.toLowerCase().split('.').pop();
    setStlLoading(true);
    setStlFileName(file.name);
    
    try {
      const buffer = await file.arrayBuffer();
      
      if (ext === 'stl') {
        const tris = parseSTLBuffer(buffer);
        const stats = analyzeTriangles(tris);
        setStlData(stats);
        toast.success('Arquivo STL analisado com sucesso!');
      } else if (ext === 'gcode') {
        const text = new TextDecoder().decode(buffer);
        const { weightG, timeHours } = parseGCode(text);
        if (weightG) setForm(f => ({ ...f, weightG: weightG.toString() }));
        if (timeHours) {
          const h = Math.floor(timeHours);
          const m = Math.round((timeHours - h) * 60);
          setForm(f => ({ ...f, h: h.toString(), m: m.toString() }));
        }
        toast.success('G-code processado!');
      } else if (ext === '3mf') {
        // Simple 3MF parsing - just listing files for now as it needs complex XML parsing
        // But we can at least detect it and warn
        toast.info('Arquivo 3MF detectado. Estimativa manual sugerida.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar o arquivo.');
    } finally {
      setStlLoading(false);
    }
  };


  const calculate = () => {
    if (!form.weightG || (!form.h && !form.m)) {
      toast.error('Peso e tempo são obrigatórios.');
      return;
    }

    const timeHours = (Number(form.h) || 0) + (Number(form.m) || 0) / 60;
    
    const inputData = {
      weightG: Number(form.weightG),
      timeHours,
      materialPricePerKg: Number(currentMat?.price_per_kg || 0),
      kwhPrice: Number(settings?.kwh || 0),
      printerWatts: Number(settings?.watt || 0),
      laborPricePerHour: Number(settings?.labor || 0),
      machinePricePerHour: Number(settings?.machine || 0),
      failurePct: Number(form.failurePct),
      marginPct: Number(form.marginPct),
      discountPct: Number(form.discountPct),
      packagingPrice: Number(form.packaging),
      platformFeePct: Number(form.platformFee),
      
      // V2
      quantity: Number(form.quantity),
      taxPct: Number(form.taxPct),
      setupMinutes: Number(form.setupMinutes),
      postProcessingPriceHour: Number(form.postProcessingPriceHour),
      postProcessingMinutes: Number(form.postProcessingMinutes)
    };

    const res = form.useV2 ? calculatePricingV2(inputData) : calculatePricing(inputData);
    setResult(res);
  };

  const mutation = useMutation({
    mutationFn: (data: any) => saveFullQuoteFn({ data }),
    onSuccess: (quote: any) => {
      toast.success('Orçamento salvo com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      // Redirecionamento temporário para histórico até a rota de ID estar pronta
      navigate({ to: '/historico' });
    },
    onError: (err: any) => toast.error('Erro ao salvar: ' + err.message)
  });

  const addItem = () => {
    if (!result) return;
    const newItem = {
      name: form.project || 'Peça sem nome',
      description: `Material: ${currentMat?.name || 'Não definido'}`,
      quantity: Number(form.quantity),
      material_name: currentMat?.name,
      weight_g: Number(form.weightG),
      time_hours: (Number(form.h) || 0) + (Number(form.m) || 0) / 60,
      unit_price: result.finalPriceUnit || result.finalPrice,
      total_price: result.finalPrice,
      cost_direct: result.subtotal / Number(form.quantity),
      profit: result.profitUnit || result.profit
    };
    setItems([...items, newItem]);
    toast.success('Peça adicionada ao orçamento!');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveFull = (kind: 'simulacao' | 'orcamento' = 'orcamento') => {
    if (items.length === 0) {
      toast.error('Adicione pelo menos uma peça ao orçamento.');
      return;
    }

    const subtotal = items.reduce((acc, item) => acc + item.total_price, 0);
    const shipping = Number(form.shippingPrice);
    const finalPrice = subtotal + shipping;

    mutation.mutate({
      title: form.title || `${kind === 'simulacao' ? 'Simulação' : 'Orçamento'} - ${new Date().toLocaleDateString()}`,
      client_id: form.clientId || null,
      client: clients.find((c: any) => c.id === form.clientId)?.name || form.client || 'Simulação Avulsa',
      project: items[0]?.name || 'Múltiplas peças',
      final_price: finalPrice,
      shipping_price: shipping,
      valid_until: form.validUntil,
      delivery_days: Number(form.deliveryDays),
      payment_terms: form.paymentTerms,
      public_notes: form.publicNotes,
      status: kind === 'simulacao' ? 'simulacao' : 'rascunho',
      kind: kind,
      items: items
    });
  };

  const handleSaveLegacy = (kind: 'simulacao' | 'orcamento') => {
    if (!result) return;
    // ... manter lógica original de simulação se necessário ou usar saveFullQuote simplificado
    handleSaveFull();
  };

  const handleMarketplace = (name: string) => {
    let fee = '0';
    if (name === 'ml_classico') fee = '12';
    if (name === 'ml_premium') fee = '16';
    if (name === 'shopee_padrao') fee = '14';
    if (name === 'shopee_ads') fee = '16';
    
    setForm(f => ({ ...f, platformName: name, platformFee: fee }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn pb-12">
      <div className="space-y-6">
        <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="text-[#f97316]" size={20} />
              Novo Orçamento
            </CardTitle>
            <CardDescription className="text-gray-400">Preencha os dados abaixo para calcular o preço ideal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-[#07071a] border border-[#22223a] rounded-xl mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#f97316]/10 rounded-lg">
                  <CalculatorIcon className="text-[#f97316]" size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Motor de Cálculo V2</p>
                  <p className="text-[10px] text-gray-500">Gross-up e custos avançados ativos</p>
                </div>
              </div>
              <Switch checked={form.useV2} onCheckedChange={checked => setForm(f => ({ ...f, useV2: checked }))} />
            </div>

            <div 
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group",
                stlData ? "border-green-500 bg-green-500/5" : "border-[#22223a] hover:border-[#f97316] bg-[#07071a]"
              )}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept=".stl,.gcode,.3mf" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              {stlLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="animate-spin text-[#f97316]" size={32} />
                  <p>Analisando arquivo...</p>
                </div>
              ) : stlData ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="text-green-500" size={32} />
                  <p className="font-bold text-green-500 truncate max-w-full">{stlFileName}</p>
                  <p className="text-xs text-gray-400">Clique para trocar o arquivo</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-full bg-[#111128] text-gray-400 group-hover:text-[#f97316] transition-colors">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-white">Arraste STL, G-code ou 3MF</p>
                    <p className="text-xs text-gray-500 mt-1">Estimativas automáticas baseadas em geometria</p>
                  </div>
                </div>
              )}
            </div>

            {stlData && (
              <div className="bg-[#07071a] border border-[#22223a] rounded-xl p-4 space-y-4 animate-fadeIn">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Info size={14} className="text-[#f97316]" />
                  Análise de Geometria
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <GeoStat label="Dimensões" value={`${stlData.dimX.toFixed(0)}x${stlData.dimY.toFixed(0)}x${stlData.dimZ.toFixed(0)}mm`} />
                  <GeoStat label="Volume" value={`${stlData.volCm3.toFixed(1)} cm³`} />
                  <GeoStat label="Área" value={`${(stlData.volCm3 * 6).toFixed(0)} cm²`} />
                  <GeoStat label="Peso Est." value={`${calcWeightFromSTL(stlData.volCm3, density, infill)}g`} accent />
                </div>
                <div className="flex flex-wrap gap-2">
                  <GeoFlag label="Overhangs" value={stlData.hasOH ? "SIM" : "NÃO"} warn={stlData.hasOH} />
                  <GeoFlag label="Bridging" value={stlData.hasBridge ? "SIM" : "NÃO"} warn={stlData.hasBridge} />
                  <GeoFlag label="Objeto Alto" value={stlData.isTall ? "SIM" : "NÃO"} warn={stlData.isTall} />
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Ajustar Infill:</span>
                    <span className="font-bold text-[#f97316]">{infill}%</span>
                  </div>
                  <Slider value={[infill]} min={5} max={100} step={5} onValueChange={v => setInfill(v[0])} className="accent-[#f97316]" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 text-white">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={form.clientId} onValueChange={v => setForm({...form, clientId: v})}>
                  <SelectTrigger className="bg-[#07071a] border-[#22223a]">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111128] border-[#22223a] text-white">
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Projeto</Label>
                <Input placeholder="Ex: Suporte" value={form.project} onChange={e => setForm({...form, project: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-white">
              <div className="space-y-2">
                <Label>Material</Label>
                <Select value={form.materialId} onValueChange={v => setForm({...form, materialId: v})}>
                  <SelectTrigger className="bg-[#07071a] border-[#22223a]">
                    <SelectValue placeholder="Selecione o material" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111128] border-[#22223a] text-white">
                    {materials?.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                          {m.name} (R${m.price_per_kg}/kg)
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Peso (g)</Label>
                <Input type="number" value={form.weightG} onChange={e => setForm({...form, weightG: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-white">
              <div className="space-y-2">
                <Label>Tempo de Impressão</Label>
                <div className="flex gap-2">
                  <Input type="number" placeholder="h" value={form.h} onChange={e => setForm({...form, h: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
                  <Input type="number" placeholder="min" value={form.m} onChange={e => setForm({...form, m: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Embalagem (R$)</Label>
                <Input type="number" value={form.packaging} onChange={e => setForm({...form, packaging: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
            </div>

            {form.useV2 && (
              <div className="grid grid-cols-2 gap-4 text-white animate-fadeIn">
                <div className="space-y-2">
                  <Label>Imposto (%)</Label>
                  <Input type="number" value={form.taxPct} onChange={e => setForm({...form, taxPct: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
                </div>
                <div className="space-y-2">
                  <Label>Setup (min)</Label>
                  <Input type="number" value={form.setupMinutes} onChange={e => setForm({...form, setupMinutes: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
                </div>
                <div className="space-y-2">
                  <Label>Custo Pós-Processo (R$/h)</Label>
                  <Input type="number" value={form.postProcessingPriceHour} onChange={e => setForm({...form, postProcessingPriceHour: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
                </div>
                <div className="space-y-2">
                  <Label>Tempo Pós (min)</Label>
                  <Input type="number" value={form.postProcessingMinutes} onChange={e => setForm({...form, postProcessingMinutes: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
                </div>
              </div>
            )}

            <Separator className="bg-[#22223a]" />

            <div className="space-y-3">
              <Label className="text-white">Marketplace de Venda</Label>
              <div className="grid grid-cols-3 gap-2">
                <MarketBtn active={form.platformName === 'none'} onClick={() => handleMarketplace('none')} icon={<Store size={16} />} label="Loja Própria" />
                <MarketBtn active={form.platformName.startsWith('ml')} onClick={() => handleMarketplace('ml_classico')} icon={<ShoppingCart size={16} />} label="M. Livre" activeColor="bg-yellow-500" />
                <MarketBtn active={form.platformName.startsWith('shopee')} onClick={() => handleMarketplace('shopee_padrao')} icon={<Package size={16} />} label="Shopee" activeColor="bg-red-500" />
              </div>
              
              {form.platformName.startsWith('ml') && (
                <div className="flex gap-2 animate-fadeIn">
                   <Button variant="outline" size="sm" className={cn("flex-1 text-xs border-[#22223a] text-white", form.platformName === 'ml_classico' && "bg-yellow-500/20 border-yellow-500 text-yellow-500")} onClick={() => handleMarketplace('ml_classico')}>Clássico (12%)</Button>
                   <Button variant="outline" size="sm" className={cn("flex-1 text-xs border-[#22223a] text-white", form.platformName === 'ml_premium' && "bg-yellow-500/20 border-yellow-500 text-yellow-500")} onClick={() => handleMarketplace('ml_premium')}>Premium (16%)</Button>
                </div>
              )}

              {form.platformName.startsWith('shopee') && (
                <div className="flex gap-2 animate-fadeIn">
                   <Button variant="outline" size="sm" className={cn("flex-1 text-xs border-[#22223a] text-white", form.platformName === 'shopee_padrao' && "bg-red-500/20 border-red-500 text-red-500")} onClick={() => handleMarketplace('shopee_padrao')}>Padrão (14%)</Button>
                   <Button variant="outline" size="sm" className={cn("flex-1 text-xs border-[#22223a] text-white", form.platformName === 'shopee_ads' && "bg-red-500/20 border-red-500 text-red-500")} onClick={() => handleMarketplace('shopee_ads')}>Com Ads (16%)</Button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-white">Taxa (%)</Label>
                  <Input type="number" value={form.platformFee} onChange={e => setForm({...form, platformFee: e.target.value})} className="w-20 bg-[#07071a] border-[#22223a] h-8 text-white" />
                </div>
                <a href="https://vendedores.mercadolivre.com.br/ajuda/custos-de-vender-um-produto_1912" target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-500 flex items-center gap-1 hover:text-[#f97316]">
                  Verificar taxas oficiais <ExternalLink size={10} />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-white">
              <div className="space-y-2">
                <Label>Falha (%)</Label>
                <Input type="number" value={form.failurePct} onChange={e => setForm({...form, failurePct: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label>Margem (%)</Label>
                <Input type="number" value={form.marginPct} onChange={e => setForm({...form, marginPct: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label>Desconto (%)</Label>
                <Input type="number" value={form.discountPct} onChange={e => setForm({...form, discountPct: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
            </div>

            <div className="space-y-2 text-white">
              <Label>Observações</Label>
              <Textarea placeholder="Notas sobre o pedido..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
            </div>

            <div className="flex gap-4 pt-4">
               <Button variant="outline" className="flex-1 border-[#22223a] hover:bg-[#22223a] text-white" onClick={() => { setForm({ client: '', clientId: '', project: '', materialId: materials?.[0]?.id || '', weightG: '', h: '', m: '', failurePct: settings?.failure.toString() || '', marginPct: settings?.margin.toString() || '', discountPct: '0', packaging: settings?.packaging.toString() || '', platformFee: settings?.platform_fee.toString() || '', platformName: 'none', notes: '', quantity: '1', taxPct: settings?.tax_pct?.toString() || '0', setupMinutes: settings?.setup_minutes?.toString() || '15', postProcessingPriceHour: settings?.post_processing_price_hour?.toString() || '0', postProcessingMinutes: '0', useV2: settings?.engine_version === 'v2', validUntil: format(addDays(new Date(), 15), 'yyyy-MM-dd'), deliveryDays: '7', paymentTerms: '', shippingPrice: '0', publicNotes: '', title: '' }); setStlData(null); setResult(null); setItems([]); }}>
                 Limpar
               </Button>
                 <Button className="flex-1 bg-[#111128] border border-[#22223a] hover:bg-[#22223a] gap-2 text-white" onClick={addItem} disabled={!result}>
                   <Plus size={18} />
                   Adicionar Peça
                 </Button>
                 <Button className="flex-1 bg-[#f97316] hover:bg-[#d96314] gap-2 text-white" onClick={calculate}>
                   <Zap size={18} />
                   Calcular Preço
                 </Button>
            </div>

            {items.length > 0 && (
              <div className="mt-8 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Itens do Orçamento ({items.length})</h3>
                  <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => setItems([])}>
                    Limpar Tudo
                  </Button>
                </div>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-[#07071a] border border-[#22223a] rounded-xl group">
                      <div className="p-2 bg-[#22223a] rounded-lg">
                        <Package size={16} className="text-[#f97316]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{item.description} • {item.quantity}un</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">R$ {item.total_price.toFixed(2)}</p>
                        <p className="text-[10px] text-green-500">Lucro: R$ {item.profit.toFixed(2)}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeItem(idx)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 bg-[#07071a] border border-[#f97316]/30 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-gray-500">Título do Orçamento</Label>
                      <Input placeholder="Ex: Orçamento #2024-001" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="h-8 bg-transparent border-[#22223a] text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-gray-500">Frete (R$)</Label>
                      <Input type="number" value={form.shippingPrice} onChange={e => setForm({...form, shippingPrice: e.target.value})} className="h-8 bg-transparent border-[#22223a] text-xs" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#22223a]">
                    <span className="text-sm font-bold">TOTAL GERAL</span>
                    <span className="text-xl font-black text-[#f97316]">
                      R$ {(items.reduce((acc, i) => acc + i.total_price, 0) + Number(form.shippingPrice)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {result ? (
          <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden shadow-2xl animate-fadeIn border-l-4 border-l-[#f97316]">
            <CardHeader>
              <CardTitle>Resultado do Cálculo</CardTitle>
              <CardDescription className="text-gray-400">Detalhamento dos custos e margens.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <CostRow label="Custo Material" value={result.costMaterial} />
                <CostRow label="Energia Elétrica" value={result.costEnergy} />
                <CostRow label="Mão de Obra" value={result.costLabor} />
                <CostRow label="Desgaste Máquina" value={result.costMachine} />
                {form.useV2 && (
                  <>
                    <CostRow label="Setup Inicial" value={result.costSetup} />
                    <CostRow label="Pós-Processo" value={result.costPost} />
                  </>
                )}
                <CostRow label="Embalagem" value={Number(form.packaging) * Number(form.quantity)} />
                <Separator className="bg-[#22223a]" />
                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-white">CUSTO TOTAL ({form.quantity}x)</span>
                  <span className="font-bold text-white">R$ {result.subtotal.toFixed(2)}</span>
                </div>
                <CostRow label="Margem de Lucro" value={result.marginValue} color="text-green-500" />
                {form.useV2 && <CostRow label="Imposto" value={result.taxValue} color="text-red-500" />}
                <CostRow label="Taxa Marketplace" value={result.platformFeeValue} color="text-red-500" />
                <CostRow label="Desconto" value={result.discountValue} color="text-red-500" />
              </div>

              <div className={cn(
                "p-6 rounded-2xl text-center space-y-1 shadow-lg transition-all",
                result.isLoss ? "bg-red-500 shadow-red-500/20" : "bg-[#f97316] shadow-[#f97316]/20"
              )}>
                <p className="text-white/80 text-xs font-bold uppercase tracking-widest">
                  {result.isLoss ? "⚠️ Prejuízo Detectado" : "Preço Final de Venda"}
                </p>
                <h2 className="text-5xl font-black text-white">R$ {result.finalPrice.toFixed(2)}</h2>
                <div className="flex justify-center gap-4 pt-2">
                    <span className="text-xs bg-white/20 px-2 py-1 rounded text-white font-medium">Margem Real: {(result?.realMarginPct || 0).toFixed(1)}%</span>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded text-white font-medium">Lucro: R$ {(result?.profit || 0).toFixed(2)}</span>
                </div>
                {result.isLoss && (
                  <p className="text-[10px] text-white/90 font-bold mt-2">Ponto de Equilíbrio: R$ {result.breakEvenPrice.toFixed(2)}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <MiniStat label="Custo/g" value={`R$ ${(result.subtotal / result.weightEff).toFixed(3)}`} />
                <MiniStat label="Preço/g" value={`R$ ${(result.finalPrice / Number(form.weightG)).toFixed(3)}`} />
                <MiniStat label="L. Líquido" value={`R$ ${result.profit.toFixed(2)}`} accent />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="border-[#22223a] text-gray-400 hover:text-white gap-2 h-12 rounded-xl"
                    onClick={() => handleSaveFull('simulacao')}
                    disabled={mutation.isPending}
                  >
                    <FileText size={18} />
                    Salvar como Simulação
                  </Button>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <Button 
                            className="w-full bg-[#f97316] hover:bg-[#d96314] text-white gap-2 h-12 rounded-xl"
                            onClick={() => handleSaveFull('orcamento')}
                            disabled={mutation.isPending || (!form.clientId && !form.client)}
                          >
                            <Save size={18} />
                            Gerar Orçamento Profissional
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {!form.clientId && !form.client && (
                        <TooltipContent className="bg-[#111128] border-[#22223a] text-white">
                          <p>Selecione um cliente para gerar um orçamento</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-[10px] text-gray-500 text-center italic">
                  Simulações não entram no faturamento, orçamentos sim.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-[#22223a] rounded-2xl opacity-50">
             <CalculatorIcon className="text-gray-600 mb-4" size={48} />
             <p className="text-gray-500">Aguardando cálculo para exibir resultados...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MarketBtn({ active, onClick, icon, label, activeColor = "bg-[#f97316]" }: any) {
  return (
    <Button 
      variant="outline" 
      className={cn(
        "flex flex-col h-auto py-3 gap-2 border-[#22223a] transition-all",
        active ? `${activeColor} border-transparent text-white` : "bg-transparent text-gray-400 hover:text-white"
      )}
      onClick={onClick}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase">{label}</span>
    </Button>
  );
}

function CostRow({ label, value, color = "text-gray-400" }: any) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={cn("font-medium", color)}>R$ {Number(value).toFixed(2)}</span>
    </div>
  );
}

function MiniStat({ label, value, accent }: any) {
  return (
    <div className="bg-[#07071a] p-3 rounded-xl border border-[#22223a] text-center">
      <p className="text-[9px] uppercase text-gray-500 font-bold">{label}</p>
      <p className={cn("text-xs font-black", accent ? "text-[#f97316]" : "text-white")}>{value}</p>
    </div>
  );
}

function GeoStat({ label, value, accent }: any) {
  return (
    <div className="bg-[#111128] p-2 rounded-lg border border-[#22223a]">
      <p className="text-[8px] uppercase text-gray-500 font-bold tracking-tighter">{label}</p>
      <p className={cn("text-[13px] font-black truncate", accent ? "text-[#f97316]" : "text-white")}>{value}</p>
    </div>
  );
}

function GeoFlag({ label, value, warn }: any) {
  return (
    <div className={cn(
      "px-2 py-1 rounded text-[10px] font-bold flex gap-1 items-center",
      warn ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30" : "bg-[#111128] text-gray-500 border border-[#22223a]"
    )}>
      <span>{label}:</span>
      <span>{value}</span>
    </div>
  );
}
