import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Edit2, Trash2, Search, Zap, Maximize } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute('/_authenticated/admin/presets')({
  component: AdminPresetsPage,
});

function AdminPresetsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingPreset, setEditingPreset] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: presets, isLoading } = useQuery({
    queryKey: ['admin', 'presets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('printer_presets' as any)
        .select('*')
        .order('brand', { ascending: true })
        .order('model', { ascending: true });
      
      if (error) throw error;
      return data as any[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        const { error } = await supabase.from('printer_presets' as any).update(data).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('printer_presets' as any).insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'presets'] });
      toast.success("Preset salvo com sucesso");
      setIsDialogOpen(false);
      setEditingPreset(null);
    },
    onError: (error: any) => toast.error("Erro ao salvar: " + error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('printer_presets' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'presets'] });
      toast.success("Preset removido");
    }
  });

  const filteredPresets = presets?.filter(p => 
    p.brand.toLowerCase().includes(search.toLowerCase()) || 
    p.model.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#f97316]" size={32} /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <Input 
            placeholder="Buscar por marca ou modelo..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-[#111128] border-[#22223a]"
          />
        </div>
        <Button onClick={() => { setEditingPreset({}); setIsDialogOpen(true); }} className="bg-[#f97316] hover:bg-[#d96314] gap-2">
          <Plus size={18} /> Novo Preset
        </Button>
      </div>

      <div className="bg-[#111128] border border-[#22223a] rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[#22223a] hover:bg-transparent">
              <TableHead className="text-gray-400">Marca/Modelo</TableHead>
              <TableHead className="text-gray-400">Tecnologia</TableHead>
              <TableHead className="text-gray-400">Watts (Méd/Pico)</TableHead>
              <TableHead className="text-gray-400 text-center">Mesa (X,Y,Z)</TableHead>
              <TableHead className="text-gray-400 text-center">Status</TableHead>
              <TableHead className="text-gray-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPresets?.map((p: any) => (
              <TableRow key={p.id} className="border-[#22223a] hover:bg-[#1a1a35]">
                <TableCell>
                  <div className="font-medium text-white">{p.brand} {p.model}</div>
                  <div className="text-[10px] text-gray-500">{p.is_estimated ? 'Estimado' : 'Medido'} {p.multicolor && '• Multicor'}</div>
                </TableCell>
                <TableCell className="capitalize text-xs">{p.tech}</TableCell>
                <TableCell className="text-xs">
                  <div className="flex items-center gap-1"><Zap size={12} className="text-amber-500" /> {p.avg_watts}W / {p.peak_watts || '?'}W</div>
                </TableCell>
                <TableCell className="text-center text-xs">
                   {p.bed_x} x {p.bed_y} x {p.bed_z}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={p.active ? "outline" : "secondary"} className={p.active ? "border-green-500 text-green-500" : ""}>
                    {p.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingPreset(p); setIsDialogOpen(true); }}>
                      <Edit2 size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-red-500" onClick={() => { if(confirm('Excluir?')) deleteMutation.mutate(p.id); }}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#111128] border-[#22223a] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPreset?.id ? 'Editar' : 'Novo'} Preset de Impressora</DialogTitle>
          </DialogHeader>
          {editingPreset && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input value={editingPreset.brand || ''} onChange={e => setEditingPreset({...editingPreset, brand: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input value={editingPreset.model || ''} onChange={e => setEditingPreset({...editingPreset, model: e.target.value})} className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label>Tecnologia</Label>
                <Select value={editingPreset.tech || 'fdm'} onValueChange={val => setEditingPreset({...editingPreset, tech: val})}>
                  <SelectTrigger className="bg-[#07071a] border-[#22223a]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#111128] border-[#22223a] text-white">
                    <SelectItem value="fdm">FDM</SelectItem>
                    <SelectItem value="resina">Resina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ordem (Sort)</Label>
                <Input type="number" value={editingPreset.sort_order || 0} onChange={e => setEditingPreset({...editingPreset, sort_order: Number(e.target.value)})} className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label>Watts Médios (Imprimindo)</Label>
                <Input type="number" value={editingPreset.avg_watts || ''} onChange={e => setEditingPreset({...editingPreset, avg_watts: Number(e.target.value)})} className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label>Watts de Pico (Aquecimento)</Label>
                <Input type="number" value={editingPreset.peak_watts || ''} onChange={e => setEditingPreset({...editingPreset, peak_watts: Number(e.target.value)})} className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label>Mesa X (mm)</Label>
                <Input type="number" value={editingPreset.bed_x || ''} onChange={e => setEditingPreset({...editingPreset, bed_x: Number(e.target.value)})} className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label>Mesa Y (mm)</Label>
                <Input type="number" value={editingPreset.bed_y || ''} onChange={e => setEditingPreset({...editingPreset, bed_y: Number(e.target.value)})} className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="space-y-2">
                <Label>Mesa Z (mm)</Label>
                <Input type="number" value={editingPreset.bed_z || ''} onChange={e => setEditingPreset({...editingPreset, bed_z: Number(e.target.value)})} className="bg-[#07071a] border-[#22223a]" />
              </div>
              <div className="flex items-center justify-between p-3 bg-[#07071a] border border-[#22223a] rounded-xl mt-6">
                <Label className="text-sm">Estimado?</Label>
                <Switch checked={editingPreset.is_estimated} onCheckedChange={checked => setEditingPreset({...editingPreset, is_estimated: checked})} />
              </div>
              <div className="flex items-center justify-between p-3 bg-[#07071a] border border-[#22223a] rounded-xl mt-6">
                <Label className="text-sm">Multicor (AMS/MMU)?</Label>
                <Switch checked={editingPreset.multicolor} onCheckedChange={checked => setEditingPreset({...editingPreset, multicolor: checked})} />
              </div>
              <div className="flex items-center justify-between p-3 bg-[#07071a] border border-[#22223a] rounded-xl mt-6">
                <Label className="text-sm">Ativo?</Label>
                <Switch checked={editingPreset.active !== false} onCheckedChange={checked => setEditingPreset({...editingPreset, active: checked})} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Observações</Label>
                <Textarea value={editingPreset.notes || ''} onChange={e => setEditingPreset({...editingPreset, notes: e.target.value})} className="bg-[#07071a] border-[#22223a] h-20" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate(editingPreset)} disabled={saveMutation.isPending} className="bg-[#f97316] hover:bg-[#d96314]">
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
