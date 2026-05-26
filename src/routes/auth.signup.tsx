import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: window.location.origin + '/auth/login',
      }
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Cadastro realizado! Verifique seu e-mail para confirmar.');
      navigate({ to: '/auth/login' });
    }
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
