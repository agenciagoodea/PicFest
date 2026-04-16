import React, { useEffect, useState } from 'react';
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
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'pix_pending'>('idle');
  const [paymentError, setPaymentError] = useState('');
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [pixData, setPixData] = useState<any>(null);

  // Seleção de método de pagamento (Padrão: pix)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'debit_card' | 'boleto'>('pix');

  // Dados do formulário Compartilhado
  const [payerEmail, setPayerEmail] = useState('');
  const [payerFirstName, setPayerFirstName] = useState('');
  const [payerLastName, setPayerLastName] = useState('');
  const [payerCpf, setPayerCpf] = useState('');

  // Dados exclusivos do Cartão
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpMonth, setCardExpMonth] = useState('');
  const [cardExpYear, setCardExpYear] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [installments, setInstallments] = useState(1);

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

  // 2. Buscar Configurações MP
  const { data: config } = useQuery({
    queryKey: ['systemConfig', 'mercadopago_config'],
    queryFn: async () => {
      const { data } = await supabase
        .from('configuracao_geral')
        .select('conteudo')
        .eq('id', 'mercadopago_config')
        .maybeSingle();
      return data?.conteudo?.mercadopago || null;
    }
  });

  // Listener Realtime para liberação automática
  useEffect(() => {
    if (!currentPaymentId) return;
    const channel = supabase
      .channel(`pay-${currentPaymentId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'payments', 
        filter: `mercado_pago_payment_id=eq.${currentPaymentId}` 
      }, (payload) => {
        if (payload.new.status === 'approved') {
          setPaymentStatus('success');
          setTimeout(() => navigate('/dashboard'), 3000);
        }
      }).subscribe();
    return () => { channel.unsubscribe(); };
  }, [currentPaymentId, navigate]);


  const enabledPaymentMethods = config?.enabledMethods || { pix: true, credit_card: true, debit_card: true, boleto: false };

  useEffect(() => {
    if (config?.publicKey && window.MercadoPago) {
      const instance = new window.MercadoPago(config.publicKey, { locale: 'pt-BR' });
      setMp(instance);
    }
  }, [config]);

  // Carregar e-mail do usuário logado se vazio
  useEffect(() => {
    const fetchUser = async() => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email && !payerEmail) {
        setPayerEmail(data.user.email);
      }
    };
    fetchUser();
  }, [payerEmail]);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;
    setPaymentStatus('processing');
    setPaymentError('');

    try {
      let cardToken = '';

      // Se for cartão, gerar o token primeiro
      if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
        if (!mp) throw new Error("Mercado Pago não inicializado.");
        
        // Na SDK v2 usamos fields.createCardToken ou createCardToken com os dados brutos conforme documentação alternativa,
        // mas o suporte principal para inputs diretos existe pelo mp.createCardToken passando os dados como objeto.
        const tokenParams = {
          cardNumber: cardNumber.replace(/\D/g, ''),
          cardholderName: cardHolderName,
          cardExpirationMonth: cardExpMonth,
          cardExpirationYear: cardExpYear.length === 2 ? `20${cardExpYear}` : cardExpYear,
          securityCode: cardCvv,
          identificationType: 'CPF',
          identificationNumber: payerCpf.replace(/\D/g, '')
        };

        const response = await mp.createCardToken(tokenParams);
        
        if (response.error) {
           console.error("Token erro:", response.error);
           throw new Error("Verifique os dados do cartão inseridos.");
        }
        cardToken = response.id;
      }

      // Enviar os dados para o nosso backend processar
      const result = await mercadoPagoService.createPayment(plan.id, {
        paymentMethod: paymentMethod,
        cardToken: cardToken || undefined,
        email: payerEmail,
        installments: (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') ? Number(installments) : 1,
        payer: {
          first_name: payerFirstName,
          last_name: payerLastName,
          identification: {
            type: 'CPF',
            number: payerCpf.replace(/\D/g, '')
          }
        }
      });

      if (result.id) {
         setCurrentPaymentId(result.id.toString());
      }

      if (result.status === 'approved') {
        setPaymentStatus('success');
        setTimeout(() => navigate('/dashboard'), 3000);
      } else if (result.status === 'pending' && paymentMethod === 'pix') {
        setPaymentStatus('pix_pending');
        setPixData(result.point_of_interaction?.transaction_data);
      } else if (result.status === 'pending' && paymentMethod === 'boleto') {
        // Redirecionar pro link do boleto ou exibir sucesso
        setPaymentStatus('success');
        window.open(result.transaction_details?.external_resource_url, '_blank');
        setTimeout(() => navigate('/dashboard'), 3000);
      } else if (result.status === 'in_process') {
         setPaymentStatus('success');
         setTimeout(() => navigate('/dashboard'), 3000);
      } else {
        setPaymentError(result.status_detail || 'Pagamento recusado.');
        setPaymentStatus('error');
      }

    } catch (error: any) {
      console.error('Checkout error:', error);
      setPaymentError(error.message || 'Falha ao processar pagamento.');
      setPaymentStatus('error');
    }
  };

  if (planLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white uppercase font-black tracking-widest animate-pulse">Configurando Ambiente...</div>;
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
                <p className="text-3xl font-black">R$ {(plan.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">por {plan.interval === 'month' ? 'mês' : plan.interval === 'year' ? 'ano' : 'evento'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-6 bg-slate-900/50 rounded-2xl border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">security</span>
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">Checkout Transparente Seguro</p>
                <p className="text-[10px] text-slate-500 font-medium pt-1">Dados confidenciais com criptografia avançada e tokenizados diretamente com o emissor.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Formulário Customizado */}
        <div className="flex flex-col gap-6 animate-in slide-in-from-right duration-700">
          
          {paymentStatus === 'idle' && (
            <div className="bg-white/5 border border-white/10 p-6 md:p-10 rounded-[3rem] shadow-2xl">
              
              {!config?.publicKey ? (
                <div className="text-center p-10">
                  <h3 className="text-slate-400 font-black tracking-widest uppercase">Parâmetros API MP Não Configurados</h3>
                </div>
              ) : (
                <form onSubmit={handleCheckoutSubmit} className="flex flex-col gap-8">
                  
                  {/* Seletor de Método de Pagamento */}
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Como você prefere pagar?</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      
                      {enabledPaymentMethods.pix && (
                        <div 
                          onClick={() => setPaymentMethod('pix')}
                          className={`cursor-pointer rounded-2xl p-4 border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'pix' ? 'bg-primary/10 border-primary text-primary' : 'bg-black/30 border-white/5 text-slate-400 hover:bg-white/5'}`}
                        >
                          <span className="material-symbols-outlined text-2xl">qr_code_2</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">PIX</span>
                        </div>
                      )}
                      
                      {enabledPaymentMethods.credit_card && (
                        <div 
                          onClick={() => setPaymentMethod('credit_card')}
                          className={`cursor-pointer rounded-2xl p-4 border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'credit_card' ? 'bg-primary/10 border-primary text-primary' : 'bg-black/30 border-white/5 text-slate-400 hover:bg-white/5'}`}
                        >
                          <span className="material-symbols-outlined text-2xl">credit_card</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-center">Cartão de Crédito</span>
                        </div>
                      )}

                      {enabledPaymentMethods.debit_card && (
                        <div 
                          onClick={() => setPaymentMethod('debit_card')}
                          className={`cursor-pointer rounded-2xl p-4 border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'debit_card' ? 'bg-primary/10 border-primary text-primary' : 'bg-black/30 border-white/5 text-slate-400 hover:bg-white/5'}`}
                        >
                          <span className="material-symbols-outlined text-2xl">credit_card</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-center">Cartão de Débito</span>
                        </div>
                      )}

                      {enabledPaymentMethods.boleto && (
                        <div 
                          onClick={() => setPaymentMethod('boleto')}
                          className={`cursor-pointer rounded-2xl p-4 border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'boleto' ? 'bg-primary/10 border-primary text-primary' : 'bg-black/30 border-white/5 text-slate-400 hover:bg-white/5'}`}
                        >
                          <span className="material-symbols-outlined text-2xl">receipt_long</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">Boleto</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dados do Comprador (Comum) */}
                  <div className="flex flex-col gap-4 border-t border-white/5 pt-6">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Seus Dados</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="Nome" required value={payerFirstName} onChange={e=>setPayerFirstName(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-sm outline-none focus:border-primary transition-all text-white placeholder:text-slate-600" />
                      
                      <input type="text" placeholder="Sobrenome" required value={payerLastName} onChange={e=>setPayerLastName(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-sm outline-none focus:border-primary transition-all text-white placeholder:text-slate-600" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="email" placeholder="E-mail" required value={payerEmail} onChange={e=>setPayerEmail(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-sm outline-none focus:border-primary transition-all text-white placeholder:text-slate-600" />
                      
                      <input type="text" placeholder="CPF (Somente Números)" required value={payerCpf} maxLength={14} onChange={e=>setPayerCpf(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-sm outline-none focus:border-primary transition-all text-white placeholder:text-slate-600 font-mono tracking-widest" />
                    </div>
                  </div>

                  {/* Dados Específicos de Cartão */}
                  {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                    <div className="flex flex-col gap-4 border-t border-white/5 pt-6 animate-in slide-in-from-bottom-2">
                       <p className="text-xs font-black uppercase tracking-widest text-slate-400">Dados do Cartão</p>

                       <input type="text" placeholder="Número do Cartão" required value={cardNumber} maxLength={19} onChange={e=>setCardNumber(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-sm outline-none focus:border-primary transition-all text-white placeholder:text-slate-600 font-mono tracking-widest" />
                       
                       <input type="text" placeholder="Nome Impresso no Cartão" required value={cardHolderName} onChange={e=>setCardHolderName(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-sm outline-none focus:border-primary transition-all text-white max-w-full placeholder:text-slate-600" />

                       <div className="grid grid-cols-3 gap-4">
                         <input type="text" placeholder="Mês (Ex: 12)" required value={cardExpMonth} maxLength={2} onChange={e=>setCardExpMonth(e.target.value)}
                          className="bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-center text-sm outline-none focus:border-primary transition-all text-white placeholder:text-slate-600 font-mono tracking-widest" />

                         <input type="text" placeholder="Ano (Ex: 28)" required value={cardExpYear} maxLength={2} onChange={e=>setCardExpYear(e.target.value)}
                          className="bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-center text-sm outline-none focus:border-primary transition-all text-white placeholder:text-slate-600 font-mono tracking-widest" />

                         <input type="text" placeholder="CVV" required value={cardCvv} maxLength={4} onChange={e=>setCardCvv(e.target.value)}
                          className="bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-center text-sm outline-none focus:border-primary transition-all text-white placeholder:text-slate-600 font-mono tracking-widest" />
                       </div>

                       <select value={installments} onChange={e=>setInstallments(Number(e.target.value))} required
                         className="bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-sm outline-none focus:border-primary transition-all text-white appearance-none">
                         <option value={1} className="bg-slate-900">1x de R$ {(plan.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</option>
                         <option value={2} className="bg-slate-900">2x de R$ {(plan.price/2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Sem Juros)</option>
                         <option value={3} className="bg-slate-900">3x de R$ {(plan.price/3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Sem Juros)</option>
                         <option value={4} className="bg-slate-900">4x de R$ {(plan.price/4).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</option>
                       </select>
                    </div>
                  )}

                  <button type="submit" className="w-full h-16 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_0_40px_-10px_rgba(19,182,236,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4">
                    <span className="material-symbols-outlined">lock</span>
                    Confirmar Pagamento
                  </button>
                  <p className="text-center text-[10px] text-slate-500 font-medium">Você aceita os Termos de Serviço ao confirmar.</p>
                </form>
              )}
            </div>
          )}

          {/* ESTADOS DE PROCESSAMENTO E SUCESSO AQUI... (mantidos semelhantes ao original) */}
          {paymentStatus === 'processing' && (
            <div className="bg-white/5 border border-white/10 p-12 rounded-[3rem] flex flex-col items-center justify-center gap-6 min-h-[500px] text-center">
              <div className="w-20 h-20 border-8 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Processando Pagamento</h2>
              <p className="text-slate-400 max-w-xs">Estabelecendo conexão super segura. Aguarde a confirmação.</p>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="bg-green-500/10 border border-green-500/20 p-12 rounded-[3rem] flex flex-col items-center justify-center gap-6 min-h-[500px] text-center">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                <span className="material-symbols-outlined text-white text-5xl">check</span>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-green-500">Pronto! Aprovado.</h2>
              <p className="text-slate-400">Assinatura autorizada e confirmada. Você será redirecionado em segundos...</p>
            </div>
          )}

          {paymentStatus === 'pix_pending' && pixData && (
            <div className="bg-white border border-white/10 p-10 md:p-14 rounded-[3rem] flex flex-col items-center justify-center gap-8 min-h-[500px] text-center text-slate-900 shadow-2xl">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-[-1rem]">
                 <span className="material-symbols-outlined text-emerald-600 text-3xl">qr_code_scanner</span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">Escaneie o QR Code</h2>
              <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100">
                <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code Pix" className="w-56 h-56 md:w-64 md:h-64 object-contain" />
              </div>
              <div className="w-full flex flex-col gap-3">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Código Copia e Cola</p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 font-mono text-[10px] break-all select-all text-left text-slate-600 shadow-inner">
                  {pixData.qr_code}
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(pixData.qr_code)}
                  className="w-full py-4 mt-2 bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span> COPIAR PIX COPIA E COLA
                </button>
              </div>
              <p className="text-xs text-slate-400 font-medium">Ao confirmar na sua conta, a liberação será instantânea.</p>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="bg-red-500/10 border border-red-500/20 p-12 rounded-[3rem] flex flex-col items-center justify-center gap-6 min-h-[500px] text-center">
              <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-5xl">warning</span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-red-500">Ops! Transação Recusada</h2>
              <p className="text-red-300 text-sm">{paymentError || 'Não conseguimos aprovar com a operadora.'}</p>
              <button 
                onClick={() => setPaymentStatus('idle')}
                className="mt-4 px-8 py-4 bg-white/10 hover:bg-white/20 text-white text-xs uppercase font-black tracking-widest rounded-xl transition-all"
              >
                VOLTAR E TENTAR NOVAMENTE
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
