import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
});


function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authHint, setAuthHint] = useState('');
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate({ to: '/', replace: true });
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthHint('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        const message = 'Não foi possível entrar com essa senha. Se essa conta foi criada pelo Google, use o botão “Entrar com Google”.';
        setAuthHint(message);
        toast.error(message);
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Login realizado com sucesso!');
      navigate({ to: '/', replace: true });
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setAuthHint('');
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
      extraParams: {
        prompt: 'select_account',
        ...(email ? { login_hint: email } : {}),
      },
    });
    if (result.error) {
      toast.error(result.error.message);
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    toast.success('Login com Google realizado com sucesso!');
    navigate({ to: '/', replace: true });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#07071a] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#111128] border-[#22223a] text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <span className="text-[#f97316]">⚡</span> Precify3D
          </CardTitle>
          <CardDescription className="text-gray-400">
            Entre com suas credenciais para acessar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="E-mail"
                className="bg-[#07071a] border-[#22223a] text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Senha"
                className="bg-[#07071a] border-[#22223a] text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-[#f97316] hover:bg-[#d96314]" disabled={loading}>
              {loading ? 'Carregando...' : 'Entrar'}
            </Button>
            {authHint && (
              <p className="rounded-xl border border-[#f97316]/40 bg-[#f97316]/10 px-4 py-3 text-sm text-[#fed7aa]">
                {authHint}
              </p>
            )}
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#22223a]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#111128] px-2 text-gray-400">Ou continue com</span>
            </div>
          </div>
          <Button type="button" variant="outline" className="w-full border-[#22223a] bg-transparent text-white hover:bg-[#22223a]" onClick={handleGoogleLogin} disabled={loading}>
            Entrar com Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm text-gray-400">Não tem uma conta?</span>
          <Link to="/auth/signup" className="text-[#f97316] hover:underline text-sm font-medium">
            Cadastre-se
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
