import { createFileRoute, Outlet, Link, useNavigate, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Calculator, History, Settings, LogOut, Menu, X, UserPlus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    // No SSR, we only check authentication on the client side for now
    // to avoid redirection loops during OAuth callback.
    if (typeof window === 'undefined') {
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    // If no session and no hash (OAuth callback), redirect to login
    if (!session && !window.location.hash.includes('access_token')) {
      throw redirect({ to: '/auth/login' });
    }
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
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        let currentProfile = profileData;
        
        if (!profileData) {
          // If profile doesn't exist, create it (fallback if trigger failed)
          const { data: newProfile } = await supabase
            .from('profiles')
            .upsert({ 
              id: user.id, 
              email: user.email!,
              role: user.email === 'lula1973@gmail.com' ? 'admin' : 'user'
            })
            .select()
            .single();
          currentProfile = newProfile;
        }
        
        setProfile(currentProfile);

        // Check for completeness and redirect if necessary
        // A profile is considered incomplete if full_name or phone or cep or address_number is missing
        const isProfileComplete = currentProfile?.full_name && currentProfile?.phone && currentProfile?.cep && currentProfile?.address_number;
        const isAtProfilePage = window.location.pathname === '/perfil';
        
        if (!isProfileComplete && !isAtProfilePage) {
          navigate({ to: '/perfil', search: { complete: 'true' } });
        }
      } else {
        // Double check on client side if session is really gone
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && !window.location.hash.includes('access_token')) {
          navigate({ to: '/auth/login' });
        }
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setProfile(data));
      } else if (!window.location.hash.includes('access_token')) {
        setUser(null);
        setProfile(null);
        navigate({ to: '/auth/login' });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: '/auth/login' });
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/' as const },
    { label: 'Calculadora', icon: Calculator, to: '/calculadora' as const },
    { label: 'Orçamentos', icon: FileText, to: '/historico' as const },
    { label: 'Clientes', icon: UserPlus, to: '/clientes' as const },
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
              <Link to="/perfil" className="hover:opacity-80 transition-opacity">
                <Avatar>
                  <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
                  <AvatarFallback>{profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 truncate">
                <p className="font-medium truncate text-xs">
                  {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}
                </p>
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
            <div className="flex items-center gap-2">
              <Link to="/perfil">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">{profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </div>
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
