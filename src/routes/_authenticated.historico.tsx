import { createFileRoute, Link } from '@tanstack/react-router';
import { getSignedUrl } from '@/lib/quotes.functions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQuotes, deleteQuote, updateQuoteStatus } from '@/lib/data.functions';
import { deleteQuoteWithFiles } from '@/lib/public-quotes.functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Search, Download, Trash2, DollarSign, TrendingUp, ShoppingBag, ClipboardList, Loader2, MoreVertical, CheckCircle2, XCircle, Clock, Undo2, Filter, AlertTriangle, FileBox } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useServerFn } from '@tanstack/react-start';
import { isVenda, valorVenda, lucroVenda, getStatusLabel, getStatusColor, STATUS_VENDA, STATUS_ABERTO, STATUS_MORTO, STATUS_NEUTRO, type QuoteStatus } from '@/lib/quote-status';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


export const Route = createFileRoute('/_authenticated/historico')({
  component: HistoryPage,
});


function HistoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [saleModal, setSaleModal] = useState<{ open: boolean, quote: any | null }>({ open: false, quote: null });
  const [lostModal, setLostModal] = useState<{ open: boolean, quote: any | null }>({ open: false, quote: null });
  const [saleForm, setSaleForm] = useState({ price: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [lostReason, setLostReason] = useState('preco');
  const [lastAction, setLastAction] = useState<{ quoteId: string, oldStatus: string } | null>(null);
  
  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => getQuotes(),
  });

  const deleteQuoteFn = useServerFn(deleteQuoteWithFiles);
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQuoteFn({ data: id }),
    onSuccess: () => {
      toast.success('Orçamento excluído.');
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (err: any) => toast.error('Erro ao excluir: ' + err.message)
  });



  const updateStatusFn = useServerFn(updateQuoteStatus);
  const updateMutation = useMutation({
    mutationFn: (data: any) => updateStatusFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (err: any) => toast.error('Erro ao atualizar status: ' + err.message)
  });

  const handleStatusChange = async (quote: any, newStatus: string) => {
    if (newStatus === 'aprovado' || newStatus === 'vendido') {
      setSaleModal({ open: true, quote });
      setSaleForm({ price: quote.final_price.toString(), date: format(new Date(), 'yyyy-MM-dd') });
      return;
    }
    if (newStatus === 'recusado') {
      setLostModal({ open: true, quote });
      return;
    }

    setLastAction({ quoteId: quote.id, oldStatus: quote.status });
    updateMutation.mutate({ id: quote.id, status: newStatus });
    
    toast('Status atualizado', {
      action: {
        label: 'Desfazer',
        onClick: () => {
          updateMutation.mutate({ id: quote.id, status: quote.status });
        }
      },
      duration: 10000
    });
  };

  const confirmSale = () => {
    if (!saleModal.quote) return;
    const sold_price = Number(saleForm.price);
    const q = saleModal.quote;
    
    // sold_profit = sold_price - sold_price * (platform_fee + tax_pct)/100 - custoDireto
    const totalFeesPct = (Number(q.platform_fee) + Number(q.tax_pct || 0)) / 100;
    const directCost = Number(q.cost_material) + Number(q.cost_energy) + Number(q.cost_labor) + Number(q.cost_machine) + 
                       Number(q.packaging) + Number(q.cost_support || 0) + Number(q.cost_post || 0) + Number(q.cost_setup || 0);
    
    const sold_profit = sold_price - (sold_price * totalFeesPct) - directCost;

    if (sold_profit < 0) {
      if (!confirm(`Essa negociação deu prejuízo de R$ ${Math.abs(sold_profit).toFixed(2)}. Deseja salvar mesmo assim?`)) return;
    }

    updateMutation.mutate({ 
      id: q.id, 
      status: 'aprovado', 
      sold_price, 
      sold_profit, 
      sold_at: new Date(saleForm.date).toISOString() 
    });
    setSaleModal({ open: false, quote: null });
    toast.success('Venda confirmada!');
  };

  const confirmLost = () => {
    if (!lostModal.quote) return;
    updateMutation.mutate({ 
      id: lostModal.quote.id, 
      status: 'recusado', 
      lost_reason: lostReason 
    });
    setLostModal({ open: false, quote: null });
    toast.success('Motivo registrado.');
  };

  const filteredQuotes = useMemo(() => {
    let result = quotes || [];
    
    if (statusFilter !== 'todos') {
      if (statusFilter === 'simulacoes') result = result.filter(q => q.kind === 'simulacao');
      else if (statusFilter === 'aberto') result = result.filter(q => STATUS_ABERTO.includes(q.status));
      else if (statusFilter === 'vendas') result = result.filter(q => STATUS_VENDA.includes(q.status));
      else if (statusFilter === 'perdidos') result = result.filter(q => STATUS_MORTO.includes(q.status));
    }

    if (search) {
      result = result.filter(q => 
        q.client?.toLowerCase().includes(search.toLowerCase()) ||
        q.project?.toLowerCase().includes(search.toLowerCase()) ||
        q.material_name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return result;
  }, [quotes, search, statusFilter]);

  const unclassifiedCount = quotes?.filter(q => q.status === 'nao_classificado').length || 0;
  const [showUnclassifiedBanner, setShowUnclassifiedBanner] = useState(true);

  const getSignedUrlFn = useServerFn(getSignedUrl);

  const downloadSTL = async (item: any) => {
    try {
      const url = await getSignedUrlFn({ data: { bucket: 'quote-files', path: item.stl_path } });
      window.open(url, '_blank');
    } catch (err) {
      toast.error('Erro ao baixar arquivo');
    }
  };

  const stats = {
    vendasRealizadas: quotes?.filter(isVenda).reduce((acc: number, q: any) => acc + valorVenda(q), 0) || 0,
    totalProfit: quotes?.filter(isVenda).reduce((acc: number, q: any) => acc + lucroVenda(q), 0) || 0,
    averageTicket: quotes?.filter(isVenda).length ? (quotes.filter(isVenda).reduce((acc: number, q: any) => acc + valorVenda(q), 0) / (quotes.filter(isVenda).length || 1)) : 0,
    totalQuotes: quotes?.length || 0,
  };

  const exportCSV = () => {
    if (!quotes?.length) return;
    
    const headers = ['Data', 'Tipo', 'Status', 'Cliente', 'Peça', 'Material', 'Preço Sugerido', 'Valor Fechado', 'Data Venda', 'Lucro'];
    const rows = filteredQuotes.map(q => [
      format(new Date(q.created_at), 'dd/MM/yyyy HH:mm'),
      q.kind === 'simulacao' ? 'Simulação' : 'Orçamento',
      getStatusLabel(q.status as QuoteStatus),
      q.client || '',
      q.project,
      q.material_name,
      q.final_price.toFixed(2),
      valorVenda(q).toFixed(2),
      q.sold_at ? format(new Date(q.sold_at), 'dd/MM/yyyy') : '',
      lucroVenda(q).toFixed(2)
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `precify3d_historico_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {unclassifiedCount > 0 && showUnclassifiedBanner && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-full text-amber-500">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="font-bold text-amber-500">Registros Pendentes</p>
              <p className="text-xs text-amber-500/80">
                Você tem {unclassifiedCount} registros salvos antes da atualização. Eles estão fora do faturamento até você classificar.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-4" onClick={() => toast.info('Funcionalidade de classificação em massa em breve!')}>
              Classificar agora
            </Button>
            <Button size="sm" variant="ghost" className="text-amber-500 hover:bg-amber-500/10" onClick={() => setShowUnclassifiedBanner(false)}>
              Dispensar
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Histórico</h1>
          <p className="text-gray-400">Gerencie todos os seus orçamentos salvos.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
            <TabsList className="bg-[#111128] border border-[#22223a]">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="simulacoes">Simulações</TabsTrigger>
              <TabsTrigger value="aberto">Em aberto</TabsTrigger>
              <TabsTrigger value="vendas">Vendas</TabsTrigger>
              <TabsTrigger value="perdidos">Perdidos</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <Input 
                placeholder="Buscar por cliente, peça..." 
                className="pl-10 bg-[#111128] border-[#22223a]"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="border-[#22223a] hover:bg-[#22223a] gap-2 rounded-xl" onClick={exportCSV}>
              <Download size={18} />
              Exportar CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Vendas realizadas" value={`R$ ${stats.vendasRealizadas.toFixed(2)}`} icon={ShoppingBag} />
        <StatCard title="Total de Lucro" value={`R$ ${stats.totalProfit.toFixed(2)}`} icon={TrendingUp} color="text-green-500" />
        <StatCard title="Ticket Médio" value={`R$ ${stats.averageTicket.toFixed(2)}`} icon={DollarSign} />
        <StatCard title="Total Registros" value={stats.totalQuotes} icon={ClipboardList} />
      </div>

      <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#22223a] hover:bg-transparent">
                <TableHead className="text-gray-400">Data</TableHead>
                <TableHead className="text-gray-400">Cliente</TableHead>
                <TableHead className="text-gray-400">Peça</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Peso</TableHead>
                <TableHead className="text-gray-400">Custo</TableHead>
                <TableHead className="text-gray-400">Preço</TableHead>
                <TableHead className="text-gray-400">Lucro</TableHead>
                <TableHead className="text-gray-400">STL</TableHead>
                <TableHead className="text-gray-400 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10">
                    <Loader2 className="animate-spin mx-auto text-[#f97316]" size={32} />
                  </TableCell>
                </TableRow>
              ) : filteredQuotes.map((quote) => (
                <TableRow key={quote.id} className="border-[#22223a] hover:bg-[#22223a]/50">
                  <TableCell className="text-gray-400 text-[10px]">
                    <Link to="/orcamentos/$id" params={{ id: quote.id }} className="hover:text-[#f97316] transition-colors">
                      {format(new Date(quote.created_at), 'dd/MM/yy HH:mm')}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    <Link to="/orcamentos/$id" params={{ id: quote.id }} className="hover:underline">
                      {quote.client || '-'}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-[150px]">
                    <Link to="/orcamentos/$id" params={{ id: quote.id }} className="hover:underline">
                      <p className="font-bold">{quote.project}</p>
                      {quote.total_pieces && quote.total_pieces > 1 && (
                        <p className="text-[9px] text-gray-500 font-mono">
                          {quote.total_pieces} un · {Math.ceil(quote.total_pieces / (quote.pieces_per_plate || 1))} pl · {Math.floor(quote.total_print_hours || 0)}h
                        </p>
                      )}
                    </Link>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Badge className={cn("cursor-pointer hover:opacity-80 transition-all border shadow-sm", getStatusColor(quote.status as QuoteStatus))}>
                          {getStatusLabel(quote.status as QuoteStatus)}
                        </Badge>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#111128] border-[#22223a] text-white">
                        <DropdownMenuLabel className="text-xs text-gray-500">Mudar status para:</DropdownMenuLabel>
                        
                        {quote.status === 'simulacao' && (
                          <>
                            <DropdownMenuItem className="focus:bg-[#f97316]/10 cursor-pointer" onClick={() => handleStatusChange(quote, 'rascunho')}>Virou orçamento</DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-green-500/10 cursor-pointer text-green-500" onClick={() => handleStatusChange(quote, 'vendido')}>Marcar como vendido</DropdownMenuItem>
                          </>
                        )}

                        {quote.status === 'rascunho' && (
                          <>
                            <DropdownMenuItem className="focus:bg-blue-500/10 cursor-pointer" onClick={() => handleStatusChange(quote, 'enviado')}>Enviado</DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-red-500/10 cursor-pointer text-red-500" onClick={() => handleStatusChange(quote, 'cancelado')}>Cancelado</DropdownMenuItem>
                          </>
                        )}

                        {quote.status === 'enviado' && (
                          <>
                            <DropdownMenuItem className="focus:bg-green-500/10 cursor-pointer text-green-500" onClick={() => handleStatusChange(quote, 'aprovado')}>Aprovado</DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-red-500/10 cursor-pointer text-red-500" onClick={() => handleStatusChange(quote, 'recusado')}>Recusado</DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-amber-500/10 cursor-pointer text-amber-500" onClick={() => handleStatusChange(quote, 'expirado')}>Expirado</DropdownMenuItem>
                          </>
                        )}

                        {quote.status === 'aprovado' && (
                          <>
                            <DropdownMenuItem className="focus:bg-green-500/10 cursor-pointer" onClick={() => handleStatusChange(quote, 'entregue')}>Entregue</DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-red-500/10 cursor-pointer text-red-500" onClick={() => handleStatusChange(quote, 'cancelado')}>Cancelado</DropdownMenuItem>
                          </>
                        )}

                        {(STATUS_MORTO.includes(quote.status)) && (
                          <DropdownMenuItem className="focus:bg-[#f97316]/10 cursor-pointer" onClick={() => handleStatusChange(quote, 'enviado')}>Reabrir</DropdownMenuItem>
                        )}

                        {quote.status === 'nao_classificado' && (
                          <>
                            <DropdownMenuItem className="focus:bg-green-500/10 cursor-pointer" onClick={() => handleStatusChange(quote, 'aprovado')}>Foi venda</DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-blue-500/10 cursor-pointer" onClick={() => handleStatusChange(quote, 'rascunho')}>Foi orçamento</DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-gray-500/10 cursor-pointer" onClick={() => handleStatusChange(quote, 'simulacao')}>Só simulação</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-sm">{quote.weight_g}g</TableCell>
                  <TableCell className="text-sm text-gray-400">R$ {Number(quote.subtotal).toFixed(2)}</TableCell>
                  <TableCell className="text-sm font-bold text-[#f97316]">
                    R$ {valorVenda(quote).toFixed(2)}
                  </TableCell>
                  <TableCell className={cn("text-sm font-medium", lucroVenda(quote) >= 0 ? "text-green-500" : "text-red-500")}>
                    R$ {lucroVenda(quote).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {quote.quote_items?.some((i: any) => i.stl_path) && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#f97316] hover:bg-[#f97316]/10" onClick={() => downloadSTL(quote.quote_items.find((i: any) => i.stl_path))}>
                        <FileBox size={16} />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-500 hover:text-blue-500 hover:bg-blue-500/10"
                        asChild
                      >
                        <Link to="/orcamentos/$id" params={{ id: quote.id }}>
                          <Download size={18} />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-500 hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => { if(confirm('Excluir este orçamento?')) deleteMutation.mutate(quote.id); }}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && !filteredQuotes.length && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-gray-500">
                    Nenhum orçamento encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={saleModal.open} onOpenChange={(open) => !open && setSaleModal({ open: false, quote: null })}>
        <DialogContent className="bg-[#111128] border-[#22223a] text-white">
          <DialogHeader>
            <DialogTitle>Confirmar Venda</DialogTitle>
            <DialogDescription className="text-gray-400">
              Registre os detalhes reais da negociação.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Valor Fechado (R$)</Label>
              <Input 
                type="number" 
                value={saleForm.price} 
                onChange={e => setSaleForm({...saleForm, price: e.target.value})}
                className="bg-[#07071a] border-[#22223a]"
              />
            </div>
            <div className="space-y-2">
              <Label>Data da Venda</Label>
              <Input 
                type="date" 
                value={saleForm.date} 
                onChange={e => setSaleForm({...saleForm, date: e.target.value})}
                className="bg-[#07071a] border-[#22223a]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#22223a]" onClick={() => setSaleModal({ open: false, quote: null })}>
              Cancelar
            </Button>
            <Button className="bg-green-500 hover:bg-green-600" onClick={confirmSale}>
              Confirmar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lostModal.open} onOpenChange={(open) => !open && setLostModal({ open: false, quote: null })}>
        <DialogContent className="bg-[#111128] border-[#22223a] text-white">
          <DialogHeader>
            <DialogTitle>Motivo da Perda</DialogTitle>
            <DialogDescription className="text-gray-400">
              Por que este orçamento não foi aprovado?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Select value={lostReason} onValueChange={setLostReason}>
                <SelectTrigger className="bg-[#07071a] border-[#22223a]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111128] border-[#22223a] text-white">
                  <SelectItem value="preco">Preço</SelectItem>
                  <SelectItem value="prazo">Prazo</SelectItem>
                  <SelectItem value="desistiu">Desistiu</SelectItem>
                  <SelectItem value="sem_resposta">Sem resposta</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#22223a]" onClick={() => setLostModal({ open: false, quote: null })}>
              Cancelar
            </Button>
            <Button className="bg-red-500 hover:bg-red-600" onClick={confirmLost}>
              Salvar Motivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color = "text-white" }: any) {
  return (
    <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <h3 className={cn("text-2xl font-bold mt-1", color)}>{value}</h3>
          </div>
          <div className="p-3 bg-[#07071a] rounded-xl text-[#f97316]">
            <Icon size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
