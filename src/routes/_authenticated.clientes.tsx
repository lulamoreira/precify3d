import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClients, saveClient, deleteClient, getSignedUrl } from '@/lib/quotes.functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Search, Edit2, Trash2, Mail, Phone, MapPin, Building2, Upload, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const Route = createFileRoute('/_authenticated/clientes' as any)({
  component: ClientsPage,
});

function ClientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const getClientsFn = useServerFn(getClients);
  const saveClientFn = useServerFn(saveClient);
  const deleteClientFn = useServerFn(deleteClient);

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => getClientsFn(),
  });

  const clients = clientsData?.data || [];

  const saveMutation = useMutation({
    mutationFn: (data: any) => saveClientFn({ data }),
    onSuccess: () => {
      toast.success(editingClient ? 'Cliente atualizado!' : 'Cliente cadastrado!');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsModalOpen(false);
      setEditingClient(null);
    },
    onError: (err: any) => toast.error('Erro ao salvar: ' + err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteClientFn({ data: id }),
    onSuccess: () => {
      toast.success('Cliente removido.');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err: any) => toast.error('Erro ao remover: ' + err.message)
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, clientId?: string) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      if (editingClient) {
        setEditingClient({ ...editingClient, logo_path: filePath });
      } else {
        // Se estiver criando, precisamos de um estado temporário ou salvar o path
        setEditingClient({ logo_path: filePath });
      }
      
      toast.success('Logo enviada!');
    } catch (error: any) {
      toast.error('Erro no upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-gray-400">Gerencie sua base de contatos para orçamentos.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <Input 
              placeholder="Buscar cliente..." 
              className="pl-10 bg-[#111128] border-[#22223a]"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <Dialog open={isModalOpen} onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) setEditingClient(null);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#f97316] hover:bg-[#d96314] gap-2 rounded-xl text-white">
                <UserPlus size={20} />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111128] border-[#22223a] text-white sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingClient?.id ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                saveMutation.mutate({ 
                  ...data, 
                  id: editingClient?.id,
                  logo_path: editingClient?.logo_path 
                });
              }} className="space-y-4 py-4">
                <div className="flex flex-col items-center gap-4 mb-4">
                  <Avatar className="h-20 w-20 border-2 border-[#22223a]">
                    <AvatarFallback className="bg-[#07071a] text-2xl">
                      {editingClient?.name?.charAt(0) || <Building2 />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" className="border-[#22223a] relative" disabled={uploading}>
                      {uploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} className="mr-2" />}
                      Upload Logo
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileUpload} />
                    </Button>
                    {editingClient?.logo_path && (
                      <Button type="button" variant="ghost" size="sm" className="text-red-400" onClick={() => setEditingClient({...editingClient, logo_path: null})}>
                        Remover
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input name="name" defaultValue={editingClient?.name} required className="bg-[#07071a] border-[#22223a]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Empresa</Label>
                    <Input name="company" defaultValue={editingClient?.company} className="bg-[#07071a] border-[#22223a]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input name="email" type="email" defaultValue={editingClient?.email} className="bg-[#07071a] border-[#22223a]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input name="phone" defaultValue={editingClient?.phone} className="bg-[#07071a] border-[#22223a]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Endereço / Observações</Label>
                  <Textarea name="address" defaultValue={editingClient?.address} className="bg-[#07071a] border-[#22223a] h-20" />
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="bg-[#f97316] hover:bg-[#d96314]" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                    Salvar Cliente
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#f97316]" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="bg-[#111128] border-[#22223a] text-white hover:border-[#f97316]/50 transition-all group overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Avatar className="h-12 w-12 border border-[#22223a]">
                    <AvatarFallback className="bg-[#07071a]">
                      {client.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => { setEditingClient(client); setIsModalOpen(true); }}>
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-400" onClick={() => { if(confirm('Remover cliente?')) deleteMutation.mutate(client.id); }}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-bold text-lg leading-tight">{client.name}</h3>
                  {client.company && (
                    <p className="text-sm text-[#f97316] flex items-center gap-1 font-medium">
                      <Building2 size={12} />
                      {client.company}
                    </p>
                  )}
                </div>

                <div className="mt-4 space-y-2 pt-4 border-t border-[#22223a]">
                  {client.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Mail size={14} />
                      {client.email}
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Phone size={14} />
                      {client.phone}
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-start gap-2 text-xs text-gray-400">
                      <MapPin size={14} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-1">{client.address}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 pt-4 border-t border-[#22223a] flex justify-between items-center">
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                    Orçamentos: 0
                  </div>
                  <Link to="/calculadora" className="text-xs text-[#f97316] font-bold hover:underline">
                    Novo Orçamento
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredClients.length === 0 && !isLoading && (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="p-4 bg-[#111128] rounded-full inline-block text-gray-600">
                <UserPlus size={48} />
              </div>
              <div>
                <p className="text-gray-400">Nenhum cliente encontrado.</p>
                <Button variant="link" className="text-[#f97316]" onClick={() => setIsModalOpen(true)}>Cadastrar primeiro cliente</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
