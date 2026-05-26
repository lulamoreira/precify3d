import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMaterials, getUserSettings, saveQuote } from '@/lib/data.functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { parseSTLBuffer, analyzeTriangles, calcWeightFromSTL, getMaterialDensity, STLData } from '@/lib/stl-utils';
import { calculatePricing, PricingResult } from '@/lib/pricing-utils';
import { Upload, Zap, Trash2, Info, ExternalLink, Package, ShoppingCart, Store, CheckCircle2, Loader2, Calculator as CalculatorIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/calculadora')({
  component: CalculatorPage,
});


function CalculatorPage() {
  const queryClient = useQueryClient();
  const { data: materials } = useQuery({ queryKey: ['materials'], queryFn: () => getMaterials() });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => getUserSettings() });

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
    notes: ''
  });

  const [stlData, setStlData] = useState<STLData | null>(null);
  const [stlLoading, setStlLoading] = useState(false);
  const [stlFileName, setStlFileName] = useState('');
  const [infill, setInfill] = useState(20);
  const [result, setResult] = useState<PricingResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMat = materials?.find(m => m.id === form.materialId);
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
      }));
    }
  }, [settings, materials]);

  useEffect(() => {
    if (stlData) {
      const weight = calcWeightFromSTL(stlData.volCm3, density, infill);
      setForm(f => ({ ...f, weightG: weight.toString() }));
    }
  }, [stlData, infill, density]);

  const handleSTLFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.stl')) {
      toast.error('Por favor, selecione um arquivo .stl');
      return;
    }

    setStlLoading(true);
    setStlFileName(file.name);
    
    try {
      const buffer = await file.arrayBuffer();
      const tris = parseSTLBuffer(buffer);
      const stats = analyzeTriangles(tris);
      setStlData(stats);
      toast.success('Arquivo STL analisado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar o arquivo STL.');
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
    
    const res = calculatePricing({
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
      platformFeePct: Number(form.platformFee)
    });

    setResult(res);
  };

  const mutation = useMutation({
    mutationFn: (data: any) => saveQuote(data),
    onSuccess: () => {
      toast.success('Orçamento salvo com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (err) => toast.error('Erro ao salvar orçamento: ' + err.message)
  });

  const handleSave = () => {
    if (!result) return;
    mutation.mutate({
      client: form.client,
      project: form.project,
      material_name: currentMat?.name || 'Desconhecido',
      weight_g: Number(form.weightG),
      time_hours: (Number(form.h) || 0) + (Number(form.m) || 0) / 60,
      failure_pct: Number(form.failurePct),
      margin_pct: Number(form.marginPct),
      discount_pct: Number(form.discountPct),
      packaging: Number(form.packaging),
      platform_fee: Number(form.platformFee),
      platform_name: form.platformName,
      cost_material: result.costMaterial,
      cost_energy: result.costEnergy,
      cost_labor: result.costLabor,
      cost_machine: result.costMachine,
      subtotal: result.subtotal,
      margin_value: result.marginValue,
      platform_fee_value: result.platformFeeValue,
      discount_value: result.discountValue,
      final_price: result.finalPrice,
      profit: result.profit,
      notes: form.notes
    });
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
            {/* Drop Zone */}
            <div 
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group",
                stlData ? "border-green-500 bg-green-500/5" : "border-[#22223a] hover:border-[#f97316] bg-[#07071a]"
              )}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleSTLFile(e.dataTransfer.files[0]); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept=".stl" onChange={e => { if (e.target.files?.[0]) handleSTLFile(e.target.files[0]); }} />
              {stlLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="animate-spin text-[#f97316]" size={32} />
                  <p>Analisando geometria...</p>
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
                    <p className="font-medium">Arraste o STL ou clique para selecionar</p>
                    <p className="text-xs text-gray-500 mt-1">Peso e dimensões preenchidos automaticamente</p>
                  </div>
                </div>
              )}
            </div>

            {/* STL Analysis Panel */}
            {stlData && (
              <div className="bg-[#07071a] border border-[#22223a] rounded-xl p-4 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-bold flex items-center gap-2">
                     <Info size={14} className="text-[#f97316]" />
                     Análise de Geometria
                   </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <GeoStat label="Dimensões" value={`${stlData.dimX.toFixed(0)}x${stlData.dimY.toFixed(0)}x${stlData.dimZ.toFixed(0)}mm`} />
                  <GeoStat label="Volume" value={`${stlData.volCm3.toFixed(1)} cm³`} />
                  <GeoStat label="Área" value={`${(stlData.volCm3 * 6).toFixed(0)} cm²`} /> {/* Area is placeholder, stl-utils simplified */}
                  <GeoStat label="Peso Est." value={`${calcWeightFromSTL(stlData.volCm3, density, infill)}g`} accent />
                </div>
                <div className="flex flex-wrap gap-2">
                  <GeoFlag label="Overhangs" value={stlData.hasOH ? "SIM" : "NÃO"} warn={stlData.hasOH} />
                  <GeoFlag label="Bridging" value={stlData.hasBridge ? "SIM" : "NÃO"} warn={stlData.hasBridge} />
                  <GeoFlag label="Objeto Alto" value={stlData.isTall ? "SIM" : "NÃO"} warn={stlData.isTall} />
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Ajustar Infill (Preenchimento):</span>
                    <span className="font-bold text-[#f97316]">{infill}%</span>
                  </div>
                  <Slider value={[infill]} min={5} max={100} step={5} onValueChange={v => setInfill(v[0])} className="accent-[#f97316]" />
                  <p className="text-[10px] text-gray-500 text-center">Peso atualizado automaticamente no formulário</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Input placeholder="Ex: João Silva" value={form.client} onChange={e => setForm({...form, client: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label>Peça/Projeto</Label>
                <Input placeholder="Ex: Suporte GPU" value={form.project} onChange={e => setForm({...form, project: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Material</Label>
                <Select value={form.materialId} onValueChange={v => setForm({...form, materialId: v})}>
                  <SelectTrigger className="bg-[#07071a] border-[#22223a]">
                    <SelectValue placeholder="Selecione o material" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111128] border-[#22223a] text-white">
                    {materials?.map(m => (
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

            <div className="grid grid-cols-2 gap-4">
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

            <Separator className="bg-[#22223a]" />

            <div className="space-y-3">
              <Label>Marketplace de Venda</Label>
              <div className="grid grid-cols-3 gap-2">
                <MarketBtn active={form.platformName === 'none'} onClick={() => handleMarketplace('none')} icon={<Store size={16} />} label="Loja Própria" />
                <MarketBtn active={form.platformName.startsWith('ml')} onClick={() => handleMarketplace('ml_classico')} icon={<ShoppingCart size={16} />} label="M. Livre" activeColor="bg-yellow-500" />
                <MarketBtn active={form.platformName.startsWith('shopee')} onClick={() => handleMarketplace('shopee_padrao')} icon={<Package size={16} />} label="Shopee" activeColor="bg-red-500" />
              </div>
              
              {form.platformName.startsWith('ml') && (
                <div className="flex gap-2 animate-fadeIn">
                   <Button variant="outline" size="sm" className={cn("flex-1 text-xs border-[#22223a]", form.platformName === 'ml_classico' && "bg-yellow-500/20 border-yellow-500 text-yellow-500")} onClick={() => handleMarketplace('ml_classico')}>Clássico (12%)</Button>
                   <Button variant="outline" size="sm" className={cn("flex-1 text-xs border-[#22223a]", form.platformName === 'ml_premium' && "bg-yellow-500/20 border-yellow-500 text-yellow-500")} onClick={() => handleMarketplace('ml_premium')}>Premium (16%)</Button>
                </div>
              )}

              {form.platformName.startsWith('shopee') && (
                <div className="flex gap-2 animate-fadeIn">
                   <Button variant="outline" size="sm" className={cn("flex-1 text-xs border-[#22223a]", form.platformName === 'shopee_padrao' && "bg-red-500/20 border-red-500 text-red-500")} onClick={() => handleMarketplace('shopee_padrao')}>Padrão (14%)</Button>
                   <Button variant="outline" size="sm" className={cn("flex-1 text-xs border-[#22223a]", form.platformName === 'shopee_ads' && "bg-red-500/20 border-red-500 text-red-500")} onClick={() => handleMarketplace('shopee_ads')}>Com Ads (16%)</Button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>Taxa (%)</Label>
                  <Input type="number" value={form.platformFee} onChange={e => setForm({...form, platformFee: e.target.value})} className="w-20 bg-[#07071a] border-[#22223a] h-8" />
                </div>
                <a href="#" className="text-[10px] text-gray-500 flex items-center gap-1 hover:text-[#f97316]">
                  Verificar taxas oficiais <ExternalLink size={10} />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
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

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea placeholder="Notas sobre o pedido..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
            </div>

            <div className="flex gap-4 pt-4">
               <Button variant="outline" className="flex-1 border-[#22223a] hover:bg-[#22223a]" onClick={() => { setForm({ client: '', project: '', materialId: materials?.[0]?.id || '', weightG: '', h: '', m: '', failurePct: settings?.failure.toString() || '', marginPct: settings?.margin.toString() || '', discountPct: '0', packaging: settings?.packaging.toString() || '', platformFee: settings?.platform_fee.toString() || '', platformName: 'none', notes: '' }); setStlData(null); setResult(null); }}>
                 Limpar
               </Button>
               <Button className="flex-1 bg-[#f97316] hover:bg-[#d96314] gap-2" onClick={calculate}>
                 <Zap size={18} />
                 Calcular Preço
               </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {result ? (
          <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden shadow-2xl animate-fadeIn border-l-4 border-l-[#f97316]">
            <CardHeader>
              <CardTitle>Resultado do Cálculo</CardTitle>
              <CardDescription className="text-gray-400">Detalhamento dos custos e margens sugeridas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <CostRow label="Custo Material" value={result.costMaterial} />
                <CostRow label="Energia Elétrica" value={result.costEnergy} />
                <CostRow label="Mão de Obra" value={result.costLabor} />
                <CostRow label="Desgaste Máquina" value={result.costMachine} />
                <CostRow label="Embalagem" value={Number(form.packaging)} />
                <Separator className="bg-[#22223a]" />
                <div className="flex justify-between items-center py-1">
                  <span className="font-bold">CUSTO TOTAL</span>
                  <span className="font-bold">R$ {result.subtotal.toFixed(2)}</span>
                </div>
                <CostRow label="Margem de Lucro" value={result.marginValue} color="text-green-500" />
                <CostRow label="Taxa Marketplace" value={result.platformFeeValue} color="text-red-500" />
                <CostRow label="Desconto" value={result.discountValue} color="text-red-500" />
              </div>

              <div className="bg-[#f97316] p-6 rounded-2xl text-center space-y-1 shadow-lg shadow-[#f97316]/20">
                <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Preço Final de Venda</p>
                <h2 className="text-5xl font-black text-white">R$ {result.finalPrice.toFixed(2)}</h2>
                <div className="flex justify-center gap-4 pt-2">
                   <span className="text-xs bg-white/20 px-2 py-1 rounded text-white font-medium">Margem Real: {((result.profit / result.finalPrice) * 100).toFixed(1)}%</span>
                   <span className="text-xs bg-white/20 px-2 py-1 rounded text-white font-medium">Lucro: R$ {result.profit.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <MiniStat label="Custo/g" value={`R$ ${(result.subtotal / result.weightEff).toFixed(3)}`} />
                <MiniStat label="Preço/g" value={`R$ ${(result.finalPrice / Number(form.weightG)).toFixed(3)}`} />
                <MiniStat label="L. Líquido" value={`R$ ${result.profit.toFixed(2)}`} accent />
              </div>

              <Button className="w-full bg-[#111128] border border-[#f97316] text-[#f97316] hover:bg-[#f97316] hover:text-white gap-2 h-12 rounded-xl" onClick={handleSave} disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="animate-spin" /> : <Package size={20} />}
                💾 Salvar Orçamento
              </Button>
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
