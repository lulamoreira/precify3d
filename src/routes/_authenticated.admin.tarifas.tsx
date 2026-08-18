import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Save, Calendar, Globe, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/_authenticated/admin/tarifas')({
  component: AdminTariffsPage,
});

function AdminTariffsPage() {
  const queryClient = useQueryClient();
  const [editingRows, setEditingRows] = useState<Record<string, any>>({});

  const { data: tariffs, isLoading } = useQuery({
    queryKey: ['admin', 'tariffs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('energy_tariffs' as any)
        .select('*')
        .order('uf', { ascending: true });
      
      if (error) throw error;
      return data as any[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (row: any) => {
      const { error } = await supabase
        .from('energy_tariffs' as any)
        .update({
          price_kwh: Number(row.price_kwh),
          source: row.source,
          reference_date: row.reference_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', row.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tariffs'] });
      toast.success("Tarifa atualizada");
    },
    onError: (error: any) => toast.error("Erro ao salvar: " + error.message)
  });

  const updateAllDatesMutation = useMutation({
    mutationFn: async (date: string) => {
      const { error } = await supabase
        .from('energy_tariffs' as any)
        .update({ reference_date: date })
        .not('id', 'is', null);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tariffs'] });
      toast.success("Datas de referência atualizadas");
    }
  });

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#f97316]" size={32} /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="bg-[#111128] border-[#22223a] text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tarifas de Energia por Estado</CardTitle>
            <CardDescription className="text-gray-400">Valores de referência R$/kWh (ANEEL/Residencial)</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-[#f97316] text-[#f97316] hover:bg-[#f97316] hover:text-white"
            onClick={() => {
              const date = prompt('Nova data de referência (AAAA-MM-DD):', '2026-03-01');
              if (date) updateAllDatesMutation.mutate(date);
            }}
          >
            <Calendar size={16} className="mr-2" />
            Atualizar datas de todos
          </Button>
        </CardHeader>
        <CardContent>
          <div className="bg-[#07071a] border border-[#22223a] rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-[#22223a] hover:bg-transparent">
                  <TableHead className="text-gray-400 w-16">UF</TableHead>
                  <TableHead className="text-gray-400">Estado</TableHead>
                  <TableHead className="text-gray-400 w-32">R$/kWh</TableHead>
                  <TableHead className="text-gray-400">Fonte</TableHead>
                  <TableHead className="text-gray-400 w-40 text-center">Referência</TableHead>
                  <TableHead className="text-gray-400 text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tariffs?.map((t: any) => {
                  const isEditing = editingRows[t.id];
                  const row = isEditing || t;
                  
                  return (
                    <TableRow key={t.id} className="border-[#22223a] hover:bg-[#1a1a35]">
                      <TableCell className="font-bold text-[#f97316]">{t.uf}</TableCell>
                      <TableCell className="text-sm">{t.state_name}</TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          step="0.001"
                          value={row.price_kwh} 
                          onChange={e => setEditingRows({...editingRows, [t.id]: {...row, price_kwh: e.target.value}})}
                          className="bg-transparent border-[#22223a] h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={row.source} 
                          onChange={e => setEditingRows({...editingRows, [t.id]: {...row, source: e.target.value}})}
                          className="bg-transparent border-[#22223a] h-8 text-[10px]"
                        />
                      </TableCell>
                      <TableCell>
                         <Input 
                          type="date"
                          value={row.reference_date} 
                          onChange={e => setEditingRows({...editingRows, [t.id]: {...row, reference_date: e.target.value}})}
                          className="bg-transparent border-[#22223a] h-8 text-xs text-center"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn("hover:text-green-500", !isEditing && "opacity-20")}
                          disabled={!isEditing || saveMutation.isPending}
                          onClick={() => {
                            saveMutation.mutate(row);
                            const next = {...editingRows};
                            delete next[t.id];
                            setEditingRows(next);
                          }}
                        >
                          <Save size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-500 text-sm">
        <Globe size={16} />
        <span>Esses valores são globais e servem como referência inicial para todos os usuários do sistema.</span>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
