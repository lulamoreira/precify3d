import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getQuoteDetails, getSignedUrl } from '@/lib/quotes.functions';
import { generatePublicLink, revokePublicLink } from '@/lib/public-quotes.functions';
import { Card, CardContent } from '@/components/ui/card';
import { Link as RouterLink } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Printer, ArrowLeft, Mail, Phone, MapPin, Copy, Link as LinkIcon, ShieldOff, Eye, FileBox, Clock, CheckCircle2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getStatusLabel, getStatusColor, type QuoteStatus } from '@/lib/quote-status';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export const Route = createFileRoute('/_authenticated/orcamentos/$id' as any)({
  component: QuoteViewPage,
});

function QuoteViewPage() {
  const { id } = Route.useParams();
  const getQuoteDetailsFn = useServerFn(getQuoteDetails);
  const getSignedUrlFn = useServerFn(getSignedUrl);
  const generateLinkFn = useServerFn(generatePublicLink);
  const revokeLinkFn = useServerFn(revokePublicLink);
  
  const documentRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [validityDays, setValidityDays] = useState(15);

  const { data: details, isLoading, refetch } = useQuery({
    queryKey: ['quote-details', id],
    queryFn: () => getQuoteDetailsFn({ data: id }),
  });

  const { data: logoUrl } = useQuery({
    queryKey: ['signed-logo', details?.quote?.clients?.logo_path],
    queryFn: () => getSignedUrlFn({ data: { bucket: 'logos', path: details?.quote?.clients?.logo_path as string } }),
    enabled: !!details?.quote?.clients?.logo_path
  });

  const { data: companyLogoUrl } = useQuery({
    queryKey: ['signed-company-logo', details?.branding?.company_logo_path],
    queryFn: () => getSignedUrlFn({ data: { bucket: 'logos', path: details?.branding?.company_logo_path as string } }),
    enabled: !!details?.branding?.company_logo_path
  });

  const handleExportPDF = async () => {
    if (!documentRef.current || !details) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`orcamento-${details.quote.quote_number || id}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      await generateLinkFn({ data: { quoteId: id, days: validityDays } });
      toast.success('Link público gerado!');
      refetch();
    } catch (error) {
      toast.error('Erro ao gerar link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleRevokeLink = async () => {
    try {
      await revokeLinkFn({ data: id });
      toast.success('Link revogado');
      refetch();
    } catch (error) {
      toast.error('Erro ao revogar link');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copiado para a área de transferência!');
  };

  const downloadSTL = async (item: any) => {
    try {
      const url = await getSignedUrlFn({ data: { bucket: 'quote-files', path: item.stl_path } });
      window.open(url, '_blank');
    } catch (err) {
      toast.error('Erro ao baixar arquivo');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-[#f97316]" size={48} />
      </div>
    );
  }

  if (!details?.quote) return <div className="text-center py-20">Orçamento não encontrado.</div>;

  const { quote, items, branding } = details;
  const brandColor = branding.brand_color || '#f97316';

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center no-print">
        <Button variant="ghost" onClick={() => window.history.back()} className="text-gray-400">
          <ArrowLeft size={18} className="mr-2" /> Voltar
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" className="border-[#22223a] text-white hover:bg-[#22223a]" onClick={() => window.print()}>
            <Printer size={18} className="mr-2" /> Imprimir
          </Button>
          <Button className="bg-[#f97316] hover:bg-[#d96314] text-white" onClick={handleExportPDF} disabled={generating}>
            {generating ? <Loader2 className="animate-spin mr-2" size={18} /> : <Download size={18} className="mr-2" />}
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="bg-[#111128] border border-[#22223a] rounded-xl p-6 no-print space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-white font-bold flex items-center gap-2">
              <LinkIcon size={18} className="text-[#f97316]" />
              Link Público do Orçamento
            </h3>
            <p className="text-xs text-gray-500">Compartilhe este link com seu cliente para visualização online profissional.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {!quote.public_token ? (
              <div className="flex items-center gap-2">
                <Select value={validityDays.toString()} onValueChange={(v) => setValidityDays(parseInt(v))}>
                  <SelectTrigger className="w-24 bg-[#07071a] border-[#22223a] text-white h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111128] border-[#22223a] text-white">
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-[#f97316] hover:bg-[#d96314] text-white h-9" onClick={handleGenerateLink} disabled={generatingLink}>
                  {generatingLink ? <Loader2 className="animate-spin" size={16} /> : "Gerar Link"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                <div className="flex items-center gap-2 bg-[#07071a] border border-[#22223a] rounded-lg px-3 py-1.5 h-9">
                  <span className="text-[10px] text-gray-500 truncate max-w-[200px]">
                    {`${window.location.origin}/o/${quote.public_token}`}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={() => copyToClipboard(`${window.location.origin}/o/${quote.public_token}`)}>
                    <Copy size={14} />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500/10 h-9" onClick={handleRevokeLink}>
                    <ShieldOff size={16} className="mr-2" /> Revogar
                  </Button>
                  <RouterLink to="/o/$token" params={{ token: quote.public_token }} target="_blank">
                    <Button variant="outline" className="border-[#22223a] text-white hover:bg-[#22223a] h-9">
                      <Eye size={16} className="mr-2" /> Visualizar
                    </Button>
                  </RouterLink>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {quote.public_token && (
          <div className="flex flex-wrap gap-4 pt-2 border-t border-[#22223a]/50 text-[10px] text-gray-400">
            <div className="flex items-center gap-1.5">
              <Clock size={12} />
              Expira em: {quote.public_expires_at ? format(new Date(quote.public_expires_at), 'dd/MM/yyyy HH:mm') : '—'}
            </div>
            {quote.viewed_at && (
              <div className="flex items-center gap-1.5 text-green-500 font-bold">
                <CheckCircle2 size={12} />
                Visualizado pelo cliente em: {quote.viewed_at ? format(new Date(quote.viewed_at), 'dd/MM/yyyy HH:mm') : '—'}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-2xl overflow-hidden text-slate-900 mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
        <div ref={documentRef} className="p-[20mm] space-y-8 bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
          
          <div className="flex justify-between items-start border-b-2 pb-8" style={{ borderColor: brandColor }}>
            <div className="space-y-4">
              {companyLogoUrl ? (
                <img src={companyLogoUrl} alt="Logo" className="h-16 object-contain" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: brandColor }}>⚡</div>
                  <span className="text-2xl font-black tracking-tighter uppercase">{branding.company_name || 'PRECIFY3D'}</span>
                </div>
              )}
              <div className="text-[10px] text-slate-500 space-y-0.5 uppercase tracking-wider font-bold">
                <p>{branding.full_name}</p>
                <p>{branding.email}</p>
                {branding.phone && <p>{branding.phone}</p>}
                <p>{branding.city} {branding.cep && `• CEP: ${branding.cep}`}</p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Orçamento</h1>
              <p className="text-xl font-bold" style={{ color: brandColor }}>#{quote.quote_number || quote.id.slice(0, 8).toUpperCase()}</p>
              <div className="text-xs text-slate-500 pt-2 font-medium">
                <p>Emissão: {format(new Date(quote.created_at), 'dd/MM/yyyy')}</p>
                {quote.valid_until && <p>Validade: {format(new Date(quote.valid_until), 'dd/MM/yyyy')}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Cliente</p>
              <div className="space-y-1 text-left">
                <h3 className="text-lg font-bold text-slate-800">{quote.clients?.name || quote.client}</h3>
                {quote.clients?.company && <p className="text-sm text-slate-600 font-medium">{quote.clients.company}</p>}
                <div className="text-xs text-slate-500 pt-2 space-y-1">
                  {quote.clients?.email && <p className="flex items-center gap-2"><Mail size={12} /> {quote.clients.email}</p>}
                  {quote.clients?.phone && <p className="flex items-center gap-2"><Phone size={12} /> {quote.clients.phone}</p>}
                  {quote.clients?.address && <p className="flex items-center gap-2 text-left"><MapPin size={12} className="shrink-0" /> {quote.clients.address}</p>}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Condições</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">Prazo de Entrega:</span>
                  <span className="font-bold text-slate-800">{quote.delivery_days || 'A combinar'} dias úteis</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">Pagamento:</span>
                  <span className="font-bold text-slate-800">{quote.payment_terms || 'A combinar'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">Status:</span>
                  <Badge variant="outline" className={cn("text-[10px] uppercase font-bold", getStatusColor(quote.status as QuoteStatus))}>
                    {getStatusLabel(quote.status as QuoteStatus)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Itens do Orçamento</p>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800 text-[10px] font-black text-slate-800 uppercase tracking-wider">
                  <th className="py-3 px-2">Item / Descrição</th>
                  <th className="py-3 px-2 text-center">Qtd</th>
                  <th className="py-3 px-2 text-right">Unitário</th>
                  <th className="py-3 px-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {items?.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-4 px-2">
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500 italic">{item.description}</p>
                    </td>
                    <td className="py-4 px-2 text-center font-medium">{item.quantity}</td>
                    <td className="py-4 px-2 text-right font-medium text-slate-600">R$ {item.unit_price.toFixed(2)}</td>
                    <td className="py-4 px-2 text-right font-bold text-slate-800">R$ {item.total_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal dos Itens:</span>
                <span className="font-medium text-slate-800">R$ {(Number(quote.final_price) - Number(quote.shipping_price || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Frete / Logística:</span>
                <span className="font-medium text-slate-800">R$ {Number(quote.shipping_price || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t-2 border-slate-800">
                <span className="text-lg font-black text-slate-800 uppercase tracking-tighter">Total Geral</span>
                <span className="text-2xl font-black text-slate-800">R$ {Number(quote.final_price).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {(quote.public_notes || quote.notes) && (
            <div className="pt-12 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Observações Importantes</p>
              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-100 whitespace-pre-wrap italic text-left">
                {quote.public_notes || quote.notes}
              </div>
            </div>
          )}

          <div className="pt-20 text-[9px] text-slate-400 text-center uppercase tracking-widest leading-loose">
            <p>Este orçamento é válido por 15 dias a partir da data de emissão.</p>
            <p>Precify3D • Software de Gestão para Impressão 3D Profissional</p>
          </div>
        </div>
      </div>
    </div>
  );
}
