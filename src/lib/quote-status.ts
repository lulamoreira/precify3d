export const STATUS_VENDA = ['aprovado', 'entregue'];
export const STATUS_ABERTO = ['rascunho', 'enviado'];
export const STATUS_MORTO = ['recusado', 'expirado', 'cancelado'];
export const STATUS_NEUTRO = ['simulacao', 'nao_classificado'];

export type QuoteStatus = 
  | 'nao_classificado' 
  | 'simulacao' 
  | 'rascunho' 
  | 'enviado' 
  | 'aprovado' 
  | 'entregue' 
  | 'recusado' 
  | 'expirado' 
  | 'cancelado';

export function isVenda(q: any) {
  return STATUS_VENDA.includes(q.status);
}

export function isAberto(q: any) {
  return STATUS_ABERTO.includes(q.status);
}

export function valorVenda(q: any) {
  return Number(q.sold_price ?? q.final_price);
}

export function lucroVenda(q: any) {
  return Number(q.sold_profit ?? q.profit);
}

export function getStatusLabel(status: QuoteStatus) {
  const labels: Record<QuoteStatus, string> = {
    simulacao: 'Simulação',
    nao_classificado: 'Não Classificado',
    rascunho: 'Rascunho',
    enviado: 'Enviado',
    aprovado: 'Aprovado',
    entregue: 'Entregue',
    recusado: 'Recusado',
    expirado: 'Expirado',
    cancelado: 'Cancelado',
  };
  return labels[status] || status;
}

export function getStatusColor(status: QuoteStatus) {
  switch (status) {
    case 'aprovado':
    case 'entregue':
      return 'bg-green-500/20 text-green-500 border-green-500/30';
    case 'enviado':
      return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
    case 'recusado':
      return 'bg-red-500/20 text-red-500 border-red-500/30';
    case 'expirado':
      return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
    case 'rascunho':
    case 'simulacao':
    case 'cancelado':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'nao_classificado':
      return 'bg-transparent text-gray-500 border-gray-500/30 border-dashed';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}
