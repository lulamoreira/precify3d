import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Shield, User, Loader2, Mail, Phone, Calendar } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/admin/usuarios')({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, subscriptions(plan_code, status, current_period_ends_at)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string, newRole: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole as any })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success("Privilégios atualizados");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar: " + error.message);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[#f97316]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Shield size={16} />
        <span>Gestão de Usuários e Permissões</span>
      </div>

      <div className="bg-[#111128] border border-[#22223a] rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[#22223a] hover:bg-transparent">
              <TableHead className="text-gray-400">Usuário</TableHead>
              <TableHead className="text-gray-400">Contato</TableHead>
              <TableHead className="text-gray-400">Plano</TableHead>
              <TableHead className="text-gray-400">Função</TableHead>
              <TableHead className="text-gray-400 text-right">Cadastrado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user: any) => (
              <TableRow key={user.id} className="border-[#22223a] hover:bg-[#1a1a35]">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#f97316]/20 flex items-center justify-center text-[#f97316]">
                      <User size={16} />
                    </div>
                    <div>
                      <div className="font-medium text-white">{user.full_name || 'Usuário sem nome'}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{user.id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Mail size={12} className="text-[#f97316]" />
                      {user.email}
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Phone size={12} className="text-[#f97316]" />
                        {user.phone}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "capitalize text-[10px]",
                      user.subscriptions?.[0]?.plan_code === 'free' ? "border-gray-500 text-gray-500" : "border-[#f97316] text-[#f97316]"
                    )}
                  >
                    {user.subscriptions?.[0]?.plan_code || 'free'}
                  </Badge>
                  {user.subscriptions?.[0]?.status && (
                    <div className="text-[9px] text-gray-600 mt-1 uppercase font-bold">
                      {user.subscriptions[0].status}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    defaultValue={user.role}
                    disabled={updateRoleMutation.isPending}
                    onValueChange={(val) => updateRoleMutation.mutate({ userId: user.id, newRole: val })}
                  >
                    <SelectTrigger className="w-[110px] h-8 bg-[#07071a] border-[#22223a] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111128] border-[#22223a] text-white">
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right text-xs text-gray-400">
                  <div className="flex items-center justify-end gap-1.5">
                    <Calendar size={12} />
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
