import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getQuotes } from '@/lib/data.functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, endOfWeek, isWithinInterval, subWeeks } from 'date-fns';
import { DollarSign, TrendingUp, ShoppingBag, ClipboardList, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useServerFn } from '@tanstack/react-start';

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
});

function DashboardPage() {
  const getQuotesFn = useServerFn(getQuotes);
  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => getQuotesFn(),
  });

  const stats = {
    totalQuotes: quotes?.length || 0,
    totalSales: quotes?.reduce((acc: number, q: any) => acc + Number(q.final_price), 0) || 0,
    totalProfit: quotes?.reduce((acc: number, q: any) => acc + Number(q.profit), 0) || 0,
    averageTicket: quotes?.length ? (quotes.reduce((acc: number, q: any) => acc + Number(q.final_price), 0) / quotes.length) : 0,
  };

  const chartData = Array.from({ length: 4 }).map((_, i) => {
    const weekStart = startOfWeek(subWeeks(new Date(), 3 - i), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const count = quotes?.filter((q: any) => {
      const date = new Date(q.created_at);
      return isWithinInterval(date, { start: weekStart, end: weekEnd });
    }).length || 0;

    return {
      name: `Semana ${i + 1}`,
      quotes: count,
    };
  });

  const recentQuotes = quotes?.slice(0, 5) || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Bem-vindo ao Precify3D</p>
        </div>
        <Link to="/calculadora">
          <Button className="bg-[#f97316] hover:bg-[#d96314] gap-2 rounded-xl text-white">
            <Plus size={20} />
            Novo Orçamento
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Orçamentos" value={stats.totalQuotes} icon={ClipboardList} />
        <StatCard title="Total em Vendas" value={`R$ ${stats.totalSales.toFixed(2)}`} icon={ShoppingBag} />
        <StatCard title="Lucro Acumulado" value={`R$ ${stats.totalProfit.toFixed(2)}`} icon={TrendingUp} color="text-green-500" />
        <StatCard title="Ticket Médio" value={`R$ ${stats.averageTicket.toFixed(2)}`} icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-[#111128] border-[#22223a] text-white overflow-hidden rounded-2xl">
          <CardHeader>
            <CardTitle>Atividade Semanal</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22223a" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111128', border: '1px solid #22223a' }}
                  itemStyle={{ color: '#f97316' }}
                />
                <Bar dataKey="quotes" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle>Orçamentos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentQuotes.map((quote: any) => (
                <div key={quote.id} className="flex items-center justify-between p-3 rounded-xl bg-[#07071a] border border-[#22223a]">
                  <div>
                    <p className="font-medium truncate max-w-[120px]">{quote.project}</p>
                    <p className="text-xs text-gray-400">{quote.client}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#f97316] font-bold">R$ {Number(quote.final_price).toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500">{format(new Date(quote.created_at), 'dd/MM HH:mm')}</p>
                  </div>
                </div>
              ))}
              {!recentQuotes.length && <p className="text-center text-gray-500 py-4">Nenhum orçamento ainda.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle>Visão Geral de Orçamentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#22223a] hover:bg-transparent">
                <TableHead className="text-gray-400">Cliente</TableHead>
                <TableHead className="text-gray-400">Peça</TableHead>
                <TableHead className="text-gray-400">Material</TableHead>
                <TableHead className="text-gray-400">Preço Final</TableHead>
                <TableHead className="text-gray-400">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentQuotes.map((quote: any) => (
                <TableRow key={quote.id} className="border-[#22223a] hover:bg-[#22223a]/50">
                  <TableCell>{quote.client}</TableCell>
                  <TableCell>{quote.project}</TableCell>
                  <TableCell>{quote.material_name}</TableCell>
                  <TableCell className="font-bold text-[#f97316]">R$ {Number(quote.final_price).toFixed(2)}</TableCell>
                  <TableCell className="text-gray-400 text-sm">{format(new Date(quote.created_at), 'dd/MM/yyyy')}</TableCell>
                </TableRow>
              ))}
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
