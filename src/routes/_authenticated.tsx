import { createFileRoute, Outlet, Link, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Calculator, History, Settings, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Unauthorized');
    }
  },
  errorComponent: ({ error }) => {
    if (error.message === 'Unauthorized') {
      window.location.href = '/auth/login';
      return null;
    }
    return <div>Error: {error.message}</div>;
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data }) => setProfile(data));
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: '/auth/login' });
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/' as const },
    { label: 'Calculadora', icon: Calculator, to: '/calculadora' as const },
    { label: 'Histórico', icon: History, to: '/historico' as const },
    { label: 'Configurações', icon: Settings, to: '/configuracoes' as const },
  ];

  return (
    <div className="min-h-screen bg-[#07071a] text-white flex">
      {!isMobile && (
        <aside className="w-64 bg-[#111128] border-r border-[#22223a] flex flex-col fixed inset-y-0">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-[#f97316]">⚡</span> Precify3D
            </h1>
          </div>
          <nav className="flex-1 px-4 space-y-2 mt-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: 'bg-[#f97316] text-white' }}
                inactiveProps={{ className: 'text-gray-400 hover:bg-[#22223a] hover:text-white' }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium"
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-[#22223a]">
            <div className="flex items-center gap-3 px-4 py-3">
              <Avatar>
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <p className="font-medium truncate text-xs">{user?.email}</p>
                {profile?.role === 'admin' && (
                  <span className="text-[10px] bg-[#f97316] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Admin</span>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-400 hover:text-white">
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </aside>
      )}
      <main className={cn("flex-1 flex flex-col", !isMobile && "pl-64")}>
        {isMobile && (
          <header className="bg-[#111128] border-b border-[#22223a] p-4 flex justify-between items-center sticky top-0 z-50">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#f97316]">⚡</span> Precify3D
            </h1>
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </header>
        )}
        <div className="p-4 md:p-8 flex-1">
          <Outlet />
        </div>
        {isMobile && (
          <nav className="bg-[#111128] border-t border-[#22223a] flex justify-around p-2 sticky bottom-0 z-50">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: 'text-[#f97316]' }}
                inactiveProps={{ className: 'text-gray-400' }}
                className="flex flex-col items-center gap-1 p-2 transition-all"
              >
                <item.icon size={20} />
                <span className="text-[10px] uppercase font-bold">{item.label}</span>
              </Link>
            ))}
          </nav>
        )}
      </main>
    </div>
  );
}
