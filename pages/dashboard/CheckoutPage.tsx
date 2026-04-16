import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabaseClient';
import { mercadoPagoService } from '../../services/mercadoPagoService';
import { Plano } from '../../types';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export const CheckoutPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [mp, setMp] = useState<any>(null);
  const brickBuilder = useRef<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'pix_pending'>('idle');
  const [pixData, setPixData] = useState<any>(null);

  // 1. Buscar detalhes do plano
  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ['plan', planId],
    queryFn: async () => {
      const { data, error } = await supabase.from('plans').select('*').eq('id', planId).single();
      if (error) throw error;
      return data as Plano;
    },
    enabled: !!planId
  });

  // 2. Buscar Public Key do Mercado Pago
  const { data: config } = useQuery({
    queryKey: ['systemConfig', 'mercadopago_config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('system_configs').select('value').eq('key', 'mercadopago_config').single();
      if (error) return { publicKey: Deno.env.get('NEXT_PUBLIC_MP_PUBLIC_KEY') || '' }; // Fallback
      return data.value;
    }
  });

  useEffect(() => {
    if (config?.publicKey && window.MercadoPago) {
      const instance = new window.MercadoPago(config.publicKey, {
        locale: 'pt-BR'
      });
      setMp(instance);
    }
  }, [config]);

  useEffect(() => {
    if (mp && plan && !brickBuilder.current) {
      const renderPaymentBrick = async (bricksBuilder: any) => {
        const settings = {
          initialization: {
            amount: plan.price,
            preferenceId: null, // Não estamos usando preferências, mas o Brick suporta tokens diretamente
            payer: {
              email: '',
            },
          },
          customization: {
            paymentMethods: {
              ticket: "all",
              bankTransfer: "all",
              creditCard: "all",
              debitCard: "all",
              mercadoPago: "all",
            },
          },
          callbacks: {
            onReady: () => {
              console.log('Brick is ready');
            },
            onSubmit: async ({ selectedPaymentMethod, formData }: any) => {
              setPaymentStatus('processing');
              try {
                const result = await mercadoPagoService.createPayment(plan.id, {
                  paymentMethod: selectedPaymentMethod === 'pix' ? 'pix' : 'credit_card',
                  cardToken: formData.token,
                  email: formData.payer.email,
                  installments: formData.installments,
                  payer: {
                    first_name: formData.payer.first_name || '',
                    last_name: formData.payer.last_name || '',
                    identification: formData.payer.identification
                  }
                });

                if (result.status === 'approved') {
                  setPaymentStatus('success');
                  setTimeout(() => navigate('/dashboard'), 3000);
                } else if (result.status === 'pending' && selectedPaymentMethod === 'pix') {
                  setPaymentStatus('pix_pending');
                  setPixData(result.point_of_interaction.transaction_data);
                } else {
                  setPaymentStatus('error');
                }
              } catch (error) {
                console.error('Payment error:', error);
                setPaymentStatus('error');
              }
            },
            onError: (error: any) => {
              console.error('Brick error:', error);
              setPaymentStatus('error');
            },
          },
        };
        brickBuilder.current = await bricksBuilder.create(
          'payment',
          'paymentBrick_container',
          settings
        );
      };

      const bricksBuilder = mp.bricks();
      renderPaymentBrick(bricksBuilder);
    }
  }, [mp, plan]);

  if (planLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white uppercase font-black tracking-widest animate-pulse">Configurando Ambiente Seguro...</div>;
  if (!plan) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white uppercase font-black tracking-widest animate-pulse">Plano não encontrado.</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 overflow-x-hidden">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Lado Esquerdo: Resumo do Plano */}
        <div className="flex flex-col gap-8 animate-in slide-in-from-left duration-700">
          <header>
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest mb-8">
              <span className="material-symbols-outlined text-sm">arrow_back</span> Voltar
            </button>
            <h1 className="text-5xl font-black tracking-tighter leading-none mb-4 uppercase">Finalize sua Assinatura</h1>
            <p className="text-slate-400 text-lg">Você está a um passo de transformar a experiência do seu evento.</p>
          </header>

          <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col gap-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] pointer-events-none group-hover:bg-primary/20 transition-all duration-1000"></div>
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-primary font-black uppercase tracking-widest text-xs mb-2">Plano Selecionado</h3>
                <h2 className="text-4xl font-black tracking-tight">{plan.name}</h2>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black">R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">por {plan.interval === 'month' ? 'mês' : plan.interval === 'year' ? 'ano' : 'evento'}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-white/10 pt-8">
               {plan.features_json?.items?.map((item: string, i: number) => (
                 <div key={i} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                   <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                   {item}
                 </div>
               ))}
            </div>

            <div className="flex items-center gap-4 p-6 bg-slate-900/50 rounded-2xl border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">security</span>
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">Pagamento 100% Seguro</p>
                <p className="text-[10px] text-slate-500 font-medium">Processado pelo Mercado Pago com criptografia de ponta a ponta.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Checkout Brick ou Status */}
        <div className="flex flex-col gap-6 animate-in slide-in-from-right duration-700">
          
          {paymentStatus === 'idle' && (
            <div className="bg-white p-4 md:p-8 rounded-[3rem] shadow-2xl shadow-primary/20 min-h-[500px]">
              <div id="paymentBrick_container"></div>
            </div>
          )}

          {paymentStatus === 'processing' && (
            <div className="bg-white/5 border border-white/10 p-12 rounded-[3rem] flex flex-col items-center justify-center gap-6 min-h-[500px] text-center">
              <div className="w-20 h-20 border-8 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Processando Pagamento</h2>
              <p className="text-slate-400 max-w-xs">Aguarde um momento enquanto confirmamos os dados com o emissor.</p>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="bg-green-500/10 border border-green-500/20 p-12 rounded-[3rem] flex flex-col items-center justify-center gap-6 min-h-[500px] text-center">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                <span className="material-symbols-outlined text-white text-5xl">check</span>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-green-500">Pagamento Aprovado!</h2>
              <p className="text-slate-400">Sua assinatura foi ativada com sucesso. Redirecionando para o seu painel...</p>
            </div>
          )}

          {paymentStatus === 'pix_pending' && pixData && (
            <div className="bg-white border border-white/10 p-12 rounded-[3rem] flex flex-col items-center justify-center gap-8 min-h-[500px] text-center text-slate-900">
              <h2 className="text-2xl font-black uppercase tracking-tight">Escaneie o QR Code</h2>
              <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100">
                <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code Pix" className="w-64 h-64" />
              </div>
              <div className="w-full flex flex-col gap-3">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Código Copia e Cola</p>
                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 font-mono text-[10px] break-all select-all">
                  {pixData.qr_code}
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(pixData.qr_code)}
                  className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span> COPIAR CÓDIGO
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Após o pagamento, o seu acesso será liberado em instantes.</p>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="bg-red-500/10 border border-red-500/20 p-12 rounded-[3rem] flex flex-col items-center justify-center gap-6 min-h-[500px] text-center">
              <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-red-500">Ops! Algo deu errado</h2>
              <p className="text-slate-400">Não conseguimos processar o seu pagamento. Por favor, tente novamente ou escolha outra forma.</p>
              <button 
                onClick={() => setPaymentStatus('idle')}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
              >
                TENTAR NOVAMENTE
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
