import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MapPin, Phone, Mail, Loader2, Save, Building2, Palette, Upload, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/perfil')({
  component: ProfilePage,
});

function ProfilePage() {
  const search = useSearch({ from: '/_authenticated/perfil' }) as any;
  const isCompleting = search?.complete === 'true';
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCep, setLoadingCep] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    cep: '',
    city: '',
    address_number: '',
    address_complement: '',
    company_name: '',
    company_logo_path: '',
    brand_color: '#f97316'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile) {
          setForm({
            full_name: profile.full_name || '',
            phone: profile.phone || '',
            cep: profile.cep || '',
            city: profile.city || '',
            address_number: profile.address_number || '',
            address_complement: profile.address_complement || '',
            company_name: profile.company_name || '',
            company_logo_path: profile.company_logo_path || '',
            brand_color: profile.brand_color || '#f97316'
          });
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleCepSearch = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    setForm(f => ({ ...f, cep: cleanCep }));

    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setForm(f => ({ ...f, city: `${data.localidade} - ${data.uf}`, cep: cleanCep }));
        }
      } catch (err) {
        console.error('Erro ao buscar CEP', err);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo deve ter menos de 2MB');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/logo-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setForm({ ...form, company_logo_path: filePath });
      toast.success('Logo enviada! Salve o perfil para confirmar.');
    } catch (error: any) {
      toast.error('Erro no upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...form,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
      if (isCompleting) {
        navigate({ to: '/calculadora' });
      }
    } catch (error: any) {
      toast.error('Erro ao atualizar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-[#f97316]" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold">{isCompleting ? 'Complete seu Cadastro' : 'Meu Perfil'}</h1>
        <p className="text-gray-400">
          {isCompleting 
            ? 'Precisamos de mais algumas informações para você começar.' 
            : 'Mantenha suas informações de contato atualizadas.'}
        </p>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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
                    <Label htmlFor="complement">Complemento</Label>
                    <Input 
                      id="complement"
                      value={form.address_complement} 
                      onChange={e => setForm({...form, address_complement: e.target.value})} 
                      className="bg-[#07071a] border-[#22223a]"
                      placeholder="Apto 101, Bloco A"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-[#111128] border-[#22223a] text-white rounded-2xl overflow-hidden shadow-lg border-l-4 border-l-[#f97316]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 size={18} className="text-[#f97316]" />
                  Branding
                </CardTitle>
                <CardDescription className="text-gray-400">Identidade da sua empresa nos orçamentos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-2 border-[#22223a]">
                      <AvatarFallback className="bg-[#07071a] text-3xl">
                        {form.company_name?.charAt(0) || <Building2 />}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute bottom-0 right-0 p-2 bg-[#f97316] rounded-full cursor-pointer hover:bg-[#d96314] transition-colors shadow-lg">
                      {uploading ? <Loader2 size={14} className="animate-spin text-white" /> : <Upload size={14} className="text-white" />}
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                    </label>
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Logo da Empresa</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name">Nome da Empresa / Fantasia</Label>
                  <Input 
                    id="company_name"
                    value={form.company_name} 
                    onChange={e => setForm({...form, company_name: e.target.value})} 
                    className="bg-[#07071a] border-[#22223a]"
                    placeholder="Minha Impressão 3D"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex justify-between items-center">
                    Cor da Marca
                    <span className="text-[10px] font-mono text-gray-500 uppercase">{form.brand_color}</span>
                  </Label>
                  <div className="flex gap-3">
                    <Input 
                      type="color" 
                      value={form.brand_color} 
                      onChange={e => setForm({...form, brand_color: e.target.value})} 
                      className="w-12 h-12 p-1 bg-[#07071a] border-[#22223a] rounded-lg cursor-pointer"
                    />
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      {['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#facc15', '#64748b'].map(c => (
                        <button
                          key={c}
                          type="button"
                          className={cn(
                            "w-full h-full rounded-md border-2 transition-all",
                            form.brand_color === c ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
                          )}
                          style={{ backgroundColor: c }}
                          onClick={() => setForm({...form, brand_color: c})}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#07071a] border-[#22223a] text-white rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#f97316]/10 rounded-lg">
                  <Mail className="text-[#f97316]" size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Conta Vinculada</p>
                  <p className="text-sm font-medium">{user?.email}</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 italic">O e-mail é usado para autenticação e não pode ser alterado diretamente.</p>
            </Card>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <Button 
            type="submit" 
            className="bg-[#f97316] hover:bg-[#d96314] text-white px-8 h-12 rounded-xl gap-2 font-bold shadow-lg shadow-[#f97316]/20"
            disabled={saving}
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
