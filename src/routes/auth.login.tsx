import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
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
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Login realizado com sucesso!');
      navigate({ to: '/' });
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
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
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#22223a]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#111128] px-2 text-gray-400">Ou continue com</span>
            </div>
          </div>
          <Button variant="outline" className="w-full border-[#22223a] bg-transparent text-white hover:bg-[#22223a]" onClick={handleGoogleLogin}>
            Google
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
