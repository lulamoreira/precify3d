import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getPublicQuote } from '@/lib/public-quotes.functions';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Printer, Mail, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export const Route = createFileRoute('/o/$token' as any)({
  component: PublicQuoteViewPage,
});

function PublicQuoteViewPage() {
  const { token } = Route.useParams();
  const getPublicQuoteFn = useServerFn(getPublicQuote);
  const documentRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-quote', token],
    queryFn: () => getPublicQuoteFn({ data: token }),
  });

  const details = data as any;

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
      pdf.save(`orcamento-${details.numero || '3d'}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#07071a]">
        <Loader2 className="animate-spin text-[#f97316]" size={48} />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[#07071a] text-white p-4">
        <h1 className="text-2xl font-bold mb-2">Orçamento não encontrado</h1>
        <p className="text-gray-400 text-center max-w-md">
          Este link pode ter expirado ou o orçamento foi revogado pelo fornecedor.
        </p>
      </div>
    );
  }

  const brandColor = details.empresa.cor || '#f97316';

  return (
    <div className="bg-[#07071a] min-h-screen pb-20 pt-8 px-4">
      <div className="max-w-[210mm] mx-auto space-y-6">
        <div className="flex justify-between items-center no-print px-4 md:px-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: brandColor }}>⚡</div>
            <span className="text-white font-bold hidden sm:inline">Precify3D</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-[#22223a] text-white hover:bg-[#22223a] h-9 px-3 text-xs" onClick={() => window.print()}>
              <Printer size={16} className="mr-2" /> Imprimir
            </Button>
            <Button className="bg-[#f97316] hover:bg-[#d96314] text-white h-9 px-3 text-xs" onClick={handleExportPDF} disabled={generating}>
              {generating ? <Loader2 className="animate-spin mr-2" size={16} /> : <Download size={16} className="mr-2" />}
              PDF
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl overflow-hidden text-slate-900 mx-auto w-full md:w-[210mm] min-h-[297mm]">
          <div ref={documentRef} className="p-6 md:p-[20mm] space-y-8 bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
            
            <div className="flex flex-col md:flex-row justify-between items-start border-b-2 pb-8 gap-6" style={{ borderColor: brandColor }}>
              <div className="space-y-4">
                {details.empresa.logo_path ? (
                  <img src={details.empresa.logo_path} alt="Logo" className="h-12 md:h-16 object-contain" />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: brandColor }}>⚡</div>
                    <span className="text-xl md:text-2xl font-black tracking-tighter uppercase">{details.empresa.nome || 'FORNECEDOR'}</span>
                  </div>
                )}
                <div className="text-[10px] text-slate-500 space-y-0.5 uppercase tracking-wider font-bold">
                  <p>{details.empresa.nome}</p>
                  {details.empresa.contato && <p>{details.empresa.contato}</p>}
                </div>
              </div>
              <div className="text-left md:text-right space-y-1">
                <h1 className="text-3xl md:text-4xl font-black text-slate-800 uppercase tracking-tighter">Orçamento</h1>
                <p className="text-lg md:text-xl font-bold" style={{ color: brandColor }}>#{details.numero}</p>
                <div className="text-xs text-slate-500 pt-2 font-medium">
                  <p>Emissão: {format(new Date(details.data), 'dd/MM/yyyy')}</p>
                  {details.validade && <p>Validade: {format(new Date(details.validade), 'dd/MM/yyyy')}</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 bg-slate-50 p-6 rounded-xl border border-slate-100">
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Cliente</p>
                <div className="space-y-1 text-left">
                  <h3 className="text-lg font-bold text-slate-800">{details.cliente.nome}</h3>
                  {details.cliente.empresa && <p className="text-sm text-slate-600 font-medium">{details.cliente.empresa}</p>}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left md:text-right">Condições</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-500">Entrega:</span>
                    <span className="font-bold text-slate-800">{details.prazo || 'A combinar'} dias úteis</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-500">Pagamento:</span>
                    <span className="font-bold text-slate-800">{details.condicoes || 'A combinar'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 overflow-x-auto">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Itens do Orçamento</p>
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b-2 border-slate-800 text-[10px] font-black text-slate-800 uppercase tracking-wider">
                    <th className="py-3 px-2">Item / Descrição</th>
                    <th className="py-3 px-2 text-center">Qtd</th>
                    <th className="py-3 px-2 text-right">Unitário</th>
                    <th className="py-3 px-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {details.itens.map((item: any, idx: number) => (
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
              <div className="w-full md:w-64 space-y-2">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-medium text-slate-800">R$ {details.subtotal.toFixed(2)}</span>
                </div>
                {details.frete > 0 && (
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Frete:</span>
                    <span className="font-medium text-slate-800">R$ {details.frete.toFixed(2)}</span>
                  </div>
                )}
                {details.desconto > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Desconto:</span>
                    <span className="font-medium">- R$ {details.desconto.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t-2 border-slate-800">
                  <span className="text-lg font-black text-slate-800 uppercase tracking-tighter">Total</span>
                  <span className="text-2xl font-black text-slate-800">R$ {details.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {details.observacoes && (
              <div className="pt-8 md:pt-12 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Observações</p>
                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-100 whitespace-pre-wrap italic text-left">
                  {details.observacoes}
                </div>
              </div>
            )}

            <div className="pt-20 text-[9px] text-slate-400 text-center uppercase tracking-widest leading-loose">
              <p>Precify3D • Orçamento Gerado Profissionalmente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
