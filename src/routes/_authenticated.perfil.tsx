import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile } from '@/lib/data.functions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { User, Phone, MapPin, Loader2, Building2, Hash, ArrowRight } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';

export const Route = createFileRoute('/_authenticated/perfil')({
  component: ProfilePage,
});

function ProfilePage() {
  const queryClient = useQueryClient();
  const updateProfileFn = useServerFn(updateProfile);
  const search: any = useSearch({ from: '/_authenticated/perfil' });
  const navigate = useNavigate();
  const isCompleting = search.complete === 'true';

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile(),
  });

  const [form, setForm] = useState<any>({
    full_name: '',
    phone: '',
    cep: '',
    city: '',
    address_number: '',
    address_complement: '',
  });
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        cep: profile.cep || '',
        city: profile.city || '',
        address_number: profile.address_number || '',
        address_complement: profile.address_complement || '',
      });
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileFn({ data: form });
      toast.success('Perfil atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (isCompleting) {
        navigate({ to: '/' });
      }
    } catch (err: any) {
      toast.error('Erro ao atualizar: ' + err.message);
    }
  };

  const handleCepSearch = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    setForm(prev => ({ ...prev, cep: cleanCep }));
    
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (data.erro) {
          toast.error('CEP não encontrado');
        } else {
          setForm(prev => ({
            ...prev,
            city: `${data.localidade} - ${data.uf}`,
            address_complement: data.logradouro + (data.bairro ? `, ${data.bairro}` : '')
          }));
        }
      } catch (err) {
        toast.error('Erro ao buscar CEP');
      } finally {
        setLoadingCep(false);
      }
    }
  };

  if (isLoading || !profile) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#f97316]" size={48} /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn pb-12">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold">{isCompleting ? 'Complete seu Cadastro' : 'Meu Perfil'}</h1>
        <p className="text-gray-400">
          {isCompleting 
            ? 'Precisamos de mais algumas informações para você começar.' 
            : 'Mantenha suas informações de contato atualizadas.'}
        </p>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User size={18} className="text-[#f97316]" />
              Dados Pessoais
            </CardTitle>
            <CardDescription className="text-gray-400">Suas informações de identificação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input 
                id="full_name"
                required
                value={form.full_name} 
                onChange={e => setForm({...form, full_name: e.target.value})} 
                className="bg-[#07071a] border-[#22223a]"
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-gray-500" size={18} />
                <Input 
                  id="phone"
                  required
                  value={form.phone} 
                  onChange={e => setForm({...form, phone: e.target.value})} 
                  className="bg-[#07071a] border-[#22223a] pl-10"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin size={18} className="text-[#f97316]" />
              Endereço
            </CardTitle>
            <CardDescription className="text-gray-400">Onde você está localizado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 text-gray-500" size={18} />
                  <Input 
                    id="cep"
                    required
                    maxLength={9}
                    value={form.cep} 
                    onChange={e => handleCepSearch(e.target.value)} 
                    className="bg-[#07071a] border-[#22223a] pl-10"
                    placeholder="00000-000"
                  />
                  {loadingCep && <Loader2 className="absolute right-3 top-3 animate-spin text-[#f97316]" size={18} />}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade / UF</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 text-gray-500" size={18} />
                  <Input 
                    id="city"
                    required
                    readOnly
                    value={form.city} 
                    className="bg-[#07071a]/50 border-[#22223a] pl-10 text-gray-400"
                    placeholder="Auto-completado pelo CEP"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1 space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input 
                  id="number"
                  required
                  value={form.address_number} 
                  onChange={e => setForm({...form, address_number: e.target.value})} 
                  className="bg-[#07071a] border-[#22223a]"
                  placeholder="123"
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="complement">Rua / Complemento</Label>
                <Input 
                  id="complement"
                  value={form.address_complement} 
                  onChange={e => setForm({...form, address_complement: e.target.value})} 
                  className="bg-[#07071a] border-[#22223a]"
                  placeholder="Rua das Flores, Apto 101"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          {!isCompleting && (
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => navigate({ to: '/' })}
              className="text-gray-400 hover:text-white"
            >
              Cancelar
            </Button>
          )}
          <Button 
            type="submit" 
            className="bg-[#f97316] hover:bg-[#d96314] px-8 rounded-xl flex items-center gap-2"
          >
            {isCompleting ? 'Finalizar Cadastro' : 'Salvar Perfil'}
            {isCompleting && <ArrowRight size={18} />}
          </Button>
        </div>
      </form>
    </div>
  );
}
