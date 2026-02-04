
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { Depoimento } from '../types';
import { FeatureCard } from '../components/common/FeatureCard';
import { PricingCard } from '../components/common/PricingCard';
import { FAQItem } from '../components/common/FAQItem';

export const LandingPage: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Depoimento[]>([]);

  useEffect(() => {
    supabaseService.getTestimonials(true).then(setTestimonials);
  }, []);

  return (
    <div className="min-h-screen bg-background-dark text-white font-sans selection:bg-primary selection:text-white">
      {/* Background Decorativo Global */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[140px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full"></div>
      </div>

      {/* Navbar Premium */}
      <header className="fixed top-0 z-[100] w-full px-6 md:px-10 py-6">
        <div className="max-w-[1400px] mx-auto bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] px-8 py-4 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white">auto_awesome_motion</span>
            </div>
            <h2 className="text-xl font-black tracking-tighter uppercase italic">EventMedia</h2>
          </div>

          <nav className="hidden lg:flex items-center gap-10">
            <a href="#features" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Recursos</a>
            <a href="#testimonials" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Depoimentos</a>
            <a href="#pricing" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Preços</a>
            <a href="#faq" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all">Login</Link>
            <Link to="/register" className="px-8 py-3 text-xs font-black uppercase tracking-widest bg-primary text-white rounded-xl shadow-xl shadow-primary/20 hover:scale-105 transition-all">Começar Agora</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-44 pb-32 px-6 flex flex-col items-center text-center overflow-hidden">
        <div className="max-w-[1000px] flex flex-col items-center gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Nova Versão 2.0 Disponível
          </div>

          <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter">
            SUA FESTA NO <br />
            <span className="text-primary italic">TELÃO</span> EM REALTIME
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-[700px] leading-relaxed font-medium">
            Transforme cada convidado em um fotógrafo oficial. Capture sorrisos, brindes e momentos únicos e exiba instantaneamente com nossa tecnologia Ultra-Low Latency.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 mt-4">
            <a href="#demo" className="px-12 py-5 bg-primary text-white font-black rounded-[1.5rem] text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
              Ver Demo Ao Vivo
            </a>
            <Link to="/register" className="px-12 py-5 bg-white/5 border border-white/10 font-black rounded-[1.5rem] text-sm uppercase tracking-widest hover:bg-white/10 transition-all">
              Criar Meu Evento
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 py-32 px-6 overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-xs font-black text-primary uppercase tracking-[0.5em] mb-4">Experiência Real</h2>
            <p className="text-4xl md:text-5xl font-black tracking-tight italic">O que os organizadores dizem</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map(t => (
              <div key={t.id} className="bg-white/5 border border-white/10 p-10 rounded-[3rem] flex flex-col gap-6 backdrop-blur-3xl shadow-2xl hover:bg-white/[0.08] transition-all group">
                <div className="flex justify-between items-start">
                  <div className="flex gap-1 text-primary">
                    {Array.from({ length: t.estrelas }).map((_, i) => (
                      <span key={i} className="material-symbols-outlined !text-xl fill-1">star</span>
                    ))}
                  </div>
                  <span className="material-symbols-outlined text-white/10 !text-5xl group-hover:text-primary/20 transition-colors">format_quote</span>
                </div>
                <p className="text-lg font-medium text-slate-300 italic leading-relaxed">"{t.texto}"</p>
                <div className="flex items-center gap-4 mt-4">
                  <img src={t.foto_url} className="w-14 h-14 rounded-2xl border-2 border-primary/20 object-cover" />
                  <div>
                    <h4 className="font-black text-white">{t.nome}</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Organizador de Eventos</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-32 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-xs font-black text-primary uppercase tracking-[0.5em] mb-4">Potencialize seu Evento</h2>
            <p className="text-4xl md:text-5xl font-black tracking-tight">Recursos Prontos para Produção</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon="qr_code_2"
              title="Acesso via QR Code"
              desc="Sem downloads. Seus convidados escaneiam e começam a enviar mídias em menos de 10 segundos."
            />
            <FeatureCard
              icon="bolt"
              title="Realtime Ultra-Fast"
              desc="Tecnologia Supabase Realtime garante que a foto apareça no telão assim que o upload for concluído."
            />
            <FeatureCard
              icon="verified_user"
              title="Moderação Inteligente"
              desc="Controle total sobre o que aparece no telão com nosso painel de curadoria em tempo real."
            />
            <FeatureCard
              icon="tv_with_extension"
              title="Telão Customizável"
              desc="Layouts imersivos que respeitam o formato da foto e adicionam movimento Ken Burns."
            />
            <FeatureCard
              icon="cloud_download"
              title="Download em Lote"
              desc="Ao final do evento, baixe todas as fotos e vídeos organizados em um arquivo ZIP de alta qualidade."
            />
            <FeatureCard
              icon="credit_card"
              title="Gestão Financeira"
              desc="Planos flexíveis interligados via Mercado Pago com liberação instantânea de recursos."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-32 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-balance">Planos que cabem no seu orçamento</h2>
            <p className="text-slate-500 font-medium">De eventos íntimos a grandes festivais corporativos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1200px] mx-auto">
            <PricingCard
              name="Básico"
              price="0"
              features={["1 Evento Ativo", "50 Mídias Totais", "1GB Storage", "Painel Básico"]}
              buttonText="Começar Grátis"
            />
            <PricingCard
              name="Profissional"
              price="49,90"
              featured={true}
              features={["10 Eventos Ativos", "1.000 Mídias/Mês", "20GB Storage", "Moderação Realtime", "Suporte VIP"]}
              buttonText="Assinar via Mercado Pago"
            />
            <PricingCard
              name="Enterprise"
              price="199,00"
              features={["Eventos Ilimitados", "Mídias Ilimitadas", "100GB Storage", "Custom Branding", "API Access"]}
              buttonText="Falar com Vendas"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 py-32 px-6 bg-white/[0.01]">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black tracking-tight italic uppercase">Dúvidas Frequentes</h2>
          </div>
          <div className="flex flex-col gap-4">
            <FAQItem question="Precisa baixar algum aplicativo?" answer="Não! Toda a experiência do convidado é via navegador mobile. Basta escanear o QR Code e enviar." />
            <FAQItem question="Como funciona a exibição no telão?" answer="O sistema gera um link exclusivo de exibição. Basta abrir esse link em um computador conectado ao projetor ou TV do evento." />
            <FAQItem question="As fotos ficam salvas por quanto tempo?" answer="Depende do seu plano. No plano Pro, as fotos ficam disponíveis para download por até 30 dias após o encerramento do evento." />
            <FAQItem question="Como é feito o pagamento?" answer="Utilizamos a API oficial do Mercado Pago para pagamentos seguros via PIX, Cartão ou Boleto." />
          </div>
        </div>
      </section>

      {/* Footer Premium */}
      <footer className="relative z-10 pt-20 pb-10 px-6 border-t border-white/5 bg-background-dark">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-1 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-white">auto_awesome_motion</span>
                </div>
                <h2 className="text-xl font-black tracking-tighter uppercase italic">EventMedia</h2>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Redefinindo a experiência visual de eventos sociais e corporativos em tempo real.
              </p>
              <div className="flex gap-4">
                {['facebook', 'instagram', 'twitter', 'linkedin'].map(i => (
                  <div key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-primary/20 hover:border-primary/50 transition-all cursor-pointer">
                    <span className="material-symbols-outlined text-sm text-slate-400">link</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">Produto</h4>
              <nav className="flex flex-col gap-4">
                <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">Recursos</a>
                <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">Demonstração</a>
                <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">Segurança</a>
              </nav>
            </div>

            <div className="flex flex-col gap-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">Empresa</h4>
              <nav className="flex flex-col gap-4">
                <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">Sobre Nós</a>
                <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">Contatos</a>
                <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">Suporte</a>
              </nav>
            </div>

            <div className="flex flex-col gap-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">Jurídico</h4>
              <nav className="flex flex-col gap-4">
                <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">Termos de Uso</a>
                <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">Privacidade</a>
              </nav>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center border-t border-white/5 pt-10 text-[10px] font-black text-slate-600 uppercase tracking-widest">
            <p>© 2024 EventMedia SaaS. Todos os direitos reservados.</p>
            <p className="mt-4 md:mt-0">Desenvolvido para momentos inesquecíveis.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
