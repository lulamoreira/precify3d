import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth/signup')({
  component: SignupPage,
});


function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user && !data.session) {
      toast.success('Conta criada! Verifique seu e-mail para confirmar seu cadastro.');
      navigate({ to: '/auth/login' });
    } else if (data.session) {
      toast.success('Cadastro realizado com sucesso! Bem-vindo.');
      navigate({ to: '/' });
    } else {
      // Fallback behavior if session is missing but user exists (shouldn't happen with auto-confirm)
      toast.success('Cadastro realizado! Tente fazer login.');
      navigate({ to: '/auth/login' });
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error(result.error.message);
  };

  return (
    <div className="min-h-screen bg-[#07071a] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#111128] border-[#22223a] text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <span className="text-[#f97316]">⚡</span> Precify3D
          </CardTitle>
          <CardDescription className="text-gray-400">
            Crie sua conta para começar a precificar seus projetos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
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
              {loading ? 'Criando conta...' : 'Cadastrar'}
            </Button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#22223a]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#111128] px-2 text-gray-400">Ou cadastre-se com</span>
            </div>
          </div>
          <Button variant="outline" className="w-full border-[#22223a] bg-transparent text-white hover:bg-[#22223a]" onClick={handleGoogleSignup}>
            Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm text-gray-400">Já tem uma conta?</span>
          <Link to="/auth/login" className="text-[#f97316] hover:underline text-sm font-medium">
            Fazer login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
