import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQuotes, deleteQuote } from '@/lib/data.functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Search, Download, Trash2, DollarSign, TrendingUp, ShoppingBag, ClipboardList, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/historico')({
  component: HistoryPage,
});

function HistoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  
  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => getQuotes(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQuote(id),
    onSuccess: () => {
      toast.success('Orçamento excluído.');
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (err) => toast.error('Erro ao excluir: ' + err.message)
  });

  const filteredQuotes = quotes?.filter(q => 
    q.client?.toLowerCase().includes(search.toLowerCase()) ||
    q.project?.toLowerCase().includes(search.toLowerCase()) ||
    q.material_name?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const stats = {
    totalQuotes: quotes?.length || 0,
    totalSales: quotes?.reduce((acc, q) => acc + Number(q.final_price), 0) || 0,
    totalProfit: quotes?.reduce((acc, q) => acc + Number(q.profit), 0) || 0,
    averageTicket: quotes?.length ? (quotes.reduce((acc, q) => acc + Number(q.final_price), 0) / quotes.length) : 0,
  };

  const exportCSV = () => {
    if (!quotes?.length) return;
    
    const headers = ['Data', 'Cliente', 'Peça', 'Material', 'Peso(g)', 'Tempo(h)', 'Custo', 'Preço Final', 'Lucro'];
    const rows = quotes.map(q => [
      format(new Date(q.created_at), 'dd/MM/yyyy HH:mm'),
      q.client,
      q.project,
      q.material_name,
      q.weight_g,
      q.time_hours.toFixed(2),
      q.subtotal.toFixed(2),
      q.final_price.toFixed(2),
      q.profit.toFixed(2)
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Histórico</h1>
          <p className="text-gray-400">Gerencie todos os seus orçamentos salvos.</p>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total em Vendas" value={`R$ ${stats.totalSales.toFixed(2)}`} icon={ShoppingBag} />
        <StatCard title="Total de Lucro" value={`R$ ${stats.totalProfit.toFixed(2)}`} icon={TrendingUp} color="text-green-500" />
        <StatCard title="Ticket Médio" value={`R$ ${stats.averageTicket.toFixed(2)}`} icon={DollarSign} />
        <StatCard title="Quantidade" value={stats.totalQuotes} icon={ClipboardList} />
      </div>

      <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#22223a] hover:bg-transparent">
                <TableHead className="text-gray-400">Data</TableHead>
                <TableHead className="text-gray-400">Cliente</TableHead>
                <TableHead className="text-gray-400">Peça</TableHead>
                <TableHead className="text-gray-400">Material</TableHead>
                <TableHead className="text-gray-400">Peso</TableHead>
                <TableHead className="text-gray-400">Tempo</TableHead>
                <TableHead className="text-gray-400">Custo</TableHead>
                <TableHead className="text-gray-400">Preço Final</TableHead>
                <TableHead className="text-gray-400">Lucro</TableHead>
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
                  <TableCell className="text-gray-400 text-xs">{format(new Date(quote.created_at), 'dd/MM/yy HH:mm')}</TableCell>
                  <TableCell className="font-medium">{quote.client}</TableCell>
                  <TableCell>{quote.project}</TableCell>
                  <TableCell>{quote.material_name}</TableCell>
                  <TableCell>{quote.weight_g}g</TableCell>
                  <TableCell>{quote.time_hours.toFixed(1)}h</TableCell>
                  <TableCell>R$ {Number(quote.subtotal).toFixed(2)}</TableCell>
                  <TableCell className="font-bold text-[#f97316]">R$ {Number(quote.final_price).toFixed(2)}</TableCell>
                  <TableCell className="text-green-500 font-medium">R$ {Number(quote.profit).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-500 hover:text-red-500 hover:bg-red-500/10"
                      onClick={() => { if(confirm('Excluir este orçamento?')) deleteMutation.mutate(quote.id); }}
                    >
                      <Trash2 size={18} />
                    </Button>
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
