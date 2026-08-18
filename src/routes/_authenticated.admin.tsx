import { createFileRoute, Outlet, redirect, Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: '/auth/login' });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw redirect({ to: '/' });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Painel Administrativo</h1>
        <div className="flex items-center gap-2 bg-[#111128] p-1 rounded-lg border border-[#22223a]">
          <Link 
            to={"/admin" as any} 
            activeOptions={{ exact: true }}
            className="px-4 py-1.5 text-sm rounded-md transition-colors [&.active]:bg-[#f97316] [&.active]:text-white text-gray-400 hover:text-white"
          >
            Dashboard
          </Link>
          <Link 
            to={"/admin/usuarios" as any} 
            className="px-4 py-1.5 text-sm rounded-md transition-colors [&.active]:bg-[#f97316] [&.active]:text-white text-gray-400 hover:text-white"
          >
            Usuários
          </Link>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
