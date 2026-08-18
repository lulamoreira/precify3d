import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile } from '@/lib/data.functions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { User, Phone, MapPin, Loader2, Building2, Hash, ArrowRight, Briefcase, Mail, FileText, Palette, Upload } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';

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
    company_name: '',
    company_document: '',
    company_phone: '',
    company_email: '',
    brand_color: '#f97316',
    company_logo_path: '',
  });
  const [loadingCep, setLoadingCep] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        cep: profile.cep || '',
        city: profile.city || '',
        address_number: profile.address_number || '',
        address_complement: profile.address_complement || '',
        company_name: profile.company_name || '',
        company_document: profile.company_document || '',
        company_phone: profile.company_phone || '',
        company_email: profile.company_email || '',
        brand_color: profile.brand_color || '#f97316',
        company_logo_path: profile.company_logo_path || '',
      });
      if (profile.company_logo_path) {
        loadLogoPreview(profile.company_logo_path);
      }
    }
  }, [profile]);

  const loadLogoPreview = async (path: string) => {
    const { data } = await supabase.storage.from('logos').createSignedUrl(path, 3600);
    if (data?.signedUrl) setLogoPreview(data.signedUrl);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo deve ter no máximo 2MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/company/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      setForm((prev: any) => ({ ...prev, company_logo_path: filePath }));
      await loadLogoPreview(filePath);
      toast.success('Logo enviada com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao enviar logo: ' + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

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
    setForm((prev: any) => ({ ...prev, cep: cleanCep }));
    
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (data.erro) {
          toast.error('CEP não encontrado');
        } else {
          setForm((prev: any) => ({
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

        <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase size={18} className="text-[#f97316]" />
              Minha Empresa
            </CardTitle>
            <CardDescription className="text-gray-400">Informações para orçamentos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="space-y-2">
                <Label>Logotipo da Empresa</Label>
                <div 
                  className="w-32 h-32 rounded-xl border-2 border-dashed border-[#22223a] bg-[#07071a] flex flex-col items-center justify-center cursor-pointer hover:border-[#f97316] transition-all overflow-hidden relative group"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-500 group-hover:text-[#f97316]">
                      <Upload size={24} />
                      <span className="text-[10px] mt-1 font-bold">Enviar Logo</span>
                    </div>
                  )}
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="animate-spin text-[#f97316]" size={24} />
                    </div>
                  )}
                </div>
                <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                <p className="text-[10px] text-gray-500">Recomendado: PNG ou SVG, máx 2MB</p>
              </div>

              <div className="flex-1 space-y-4 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Nome da Empresa</Label>
                    <Input 
                      id="company_name"
                      value={form.company_name} 
                      onChange={e => setForm({...form, company_name: e.target.value})} 
                      className="bg-[#07071a] border-[#22223a]"
                      placeholder="Ex: Print 3D Studio"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_document">CNPJ / CPF</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 text-gray-500" size={18} />
                      <Input 
                        id="company_document"
                        value={form.company_document} 
                        onChange={e => setForm({...form, company_document: e.target.value})} 
                        className="bg-[#07071a] border-[#22223a] pl-10"
                        placeholder="00.000.000/0001-00"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_email">E-mail da Empresa</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                      <Input 
                        id="company_email"
                        type="email"
                        value={form.company_email} 
                        onChange={e => setForm({...form, company_email: e.target.value})} 
                        className="bg-[#07071a] border-[#22223a] pl-10"
                        placeholder="contato@empresa.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_phone">Telefone da Empresa</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-gray-500" size={18} />
                      <Input 
                        id="company_phone"
                        value={form.company_phone} 
                        onChange={e => setForm({...form, company_phone: e.target.value})} 
                        className="bg-[#07071a] border-[#22223a] pl-10"
                        placeholder="(11) 4002-8922"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand_color">Cor da Marca</Label>
                  <div className="flex gap-4 items-center">
                    <div className="relative flex-1">
                      <Palette className="absolute left-3 top-3 text-gray-500" size={18} />
                      <Input 
                        id="brand_color"
                        value={form.brand_color} 
                        onChange={e => setForm({...form, brand_color: e.target.value})} 
                        className="bg-[#07071a] border-[#22223a] pl-10 uppercase"
                        placeholder="#F97316"
                        maxLength={7}
                      />
                    </div>
                    <div 
                      className="w-10 h-10 rounded-lg border border-[#22223a]" 
                      style={{ backgroundColor: form.brand_color }} 
                    />
                    <input 
                      type="color" 
                      value={form.brand_color} 
                      onChange={e => setForm({...form, brand_color: e.target.value})}
                      className="w-10 h-10 cursor-pointer bg-transparent border-none"
                    />
                  </div>
                </div>
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
