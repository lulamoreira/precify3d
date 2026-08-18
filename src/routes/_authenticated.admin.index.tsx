import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, CreditCard, Activity } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/admin/' as any)({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { data: recentCredits } = await supabase
        .from('usage_events')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(10);
      
      return {
        userCount: userCount || 0,
        recentCredits: recentCredits || []
      };
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#111128] border-[#22223a] text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-[#f97316]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.userCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#111128] border-[#22223a] text-white">
        <CardHeader>
          <CardTitle className="text-lg">Atividade Recente de Créditos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-[#22223a] hover:bg-transparent">
                <TableHead className="text-gray-400">Usuário</TableHead>
                <TableHead className="text-gray-400">Ação</TableHead>
                <TableHead className="text-gray-400">Fingerprint</TableHead>
                <TableHead className="text-gray-400 text-right">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.recentCredits.map((log: any) => (
                <TableRow key={log.id} className="border-[#22223a] hover:bg-[#1a1a35]">
                  <TableCell className="font-medium">
                    <div>{log.profiles?.full_name || 'Usuário'}</div>
                    <div className="text-[10px] text-gray-500">{log.profiles?.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] border-[#f97316] text-[#f97316]">
                      {log.label || 'Pricing'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-gray-500">
                    {log.fingerprint?.substring(0, 16)}...
                  </TableCell>
                  <TableCell className="text-right text-xs text-gray-400">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
