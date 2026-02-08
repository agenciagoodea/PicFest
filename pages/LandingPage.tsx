
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { Plano, Depoimento } from '../types';
import { FeatureCard } from '../components/common/FeatureCard';
import { PricingCard } from '../components/common/PricingCard';
import { FAQItem } from '../components/common/FAQItem';
import { mercadoPagoService } from '../services/mercadoPagoService';

export const LandingPage: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Depoimento[]>([]);
  const [plans, setPlans] = useState<Plano[]>([]);
  const [config, setConfig] = useState<any>({
    hero: { titulo: 'SUA FESTA NO TELÃO EM REALTIME', subtitulo: 'Transforme cada convidado em um fotógrafo oficial.', cta_botao: 'Começar Agora' },
    contato: { email: 'contato@picfest.com', telefone: '', instagram: '' },
    faq: []
  });
  const [loading, setLoading] = useState({
    testimonials: true,
    plans: true,
    config: true
  });

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const [testimonialsData, plansData, configData] = await Promise.all([
          supabaseService.getTestimonials(true),
          supabaseService.getPlans(),
          supabaseService.getLandingConfig()
        ]);

        if (!controller.signal.aborted) {
          setTestimonials(testimonialsData);
          setPlans(plansData);
          if (configData) setConfig(configData);
          setLoading({ testimonials: false, plans: false, config: false });
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Erro ao carregar dados da landing:', err);
        }
      }
    };

    fetchData();

    return () => controller.abort();
  }, []);

  const handleSubscribe = (plano: Plano) => {
    mercadoPagoService.checkout(plano.id, plano.valor, plano.nome);
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // O loading global foi removido em favor do carregamento progressivo

  return (
    <div className="min-h-screen bg-background-dark text-white font-sans selection:bg-primary selection:text-white">
      {/* Background Decorativo Global */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[140px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full"></div>
      </div>

      {/* Navbar Premium */}
      <header className="fixed top-0 z-[100] w-full px-4 md:px-10 py-6">
        <div className="max-w-[1400px] mx-auto bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] md:rounded-[2rem] px-6 md:px-8 py-4 flex items-center justify-between shadow-2xl relative">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-xl md:text-2xl">auto_awesome_motion</span>
            </div>
            <h2 className="text-lg md:text-xl font-black tracking-tighter uppercase italic">PicFest</h2>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-10">
            <a href="#features" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Recursos</a>
            <a href="#testimonials" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Depoimentos</a>
            <a href="#pricing" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Preços</a>
            <a href="#faq" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <Link to="/login" className="hidden sm:block px-4 md:px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all">Login</Link>
            <Link to="/register" className="px-4 md:px-8 py-3 text-[10px] md:text-xs font-black uppercase tracking-widest bg-primary text-white rounded-xl shadow-xl shadow-primary/20 hover:scale-105 transition-all">Começar</Link>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden w-10 h-10 flex items-center justify-center text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="material-symbols-outlined">{isMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>

          {/* Mobile Menu Overlay */}
          {isMenuOpen && (
            <div className="absolute top-full left-0 w-full mt-4 bg-background-dark/95 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] p-8 flex flex-col gap-6 lg:hidden animate-in fade-in slide-in-from-top-4">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-sm font-black uppercase tracking-widest text-slate-400">Recursos</a>
              <a href="#testimonials" onClick={() => setIsMenuOpen(false)} className="text-sm font-black uppercase tracking-widest text-slate-400">Depoimentos</a>
              <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-sm font-black uppercase tracking-widest text-slate-400">Preços</a>
              <a href="#faq" onClick={() => setIsMenuOpen(false)} className="text-sm font-black uppercase tracking-widest text-slate-400">FAQ</a>
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-sm font-black uppercase tracking-widest text-primary pt-4 border-t border-white/5">Login</Link>
            </div>
          )}
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
            Nova Versão 2.1 Disponível
          </div>

          <h1 className="text-4xl md:text-8xl font-black leading-[1.1] md:leading-[0.9] tracking-tighter uppercase px-4">
            {config.hero.titulo.includes('<br />') ? (
              config.hero.titulo.split('<br />').map((line: string, i: number) => (
                <React.Fragment key={i}>
                  {line} <br />
                </React.Fragment>
              ))
            ) : (
              config.hero.titulo
            )}
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-[700px] leading-relaxed font-medium">
            {config.hero.subtitulo}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 mt-4">
            <Link to="/register" className="px-12 py-5 bg-primary text-white font-black rounded-[1.5rem] text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
              {config.hero.cta_botao}
            </Link>
            <a href="#features" className="px-12 py-5 bg-white/5 border border-white/10 font-black rounded-[1.5rem] text-sm uppercase tracking-widest hover:bg-white/10 transition-all">
              Saiba Mais
            </a>
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
            {loading.testimonials ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white/5 border border-white/10 p-10 rounded-[3rem] h-64 animate-pulse"></div>
              ))
            ) : (
              testimonials.map(t => (
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
                    <img src={t.foto_url || `https://i.pravatar.cc/150?u=${t.id}`} loading="lazy" className="w-14 h-14 rounded-2xl border-2 border-primary/20 object-cover" />
                    <div>
                      <h4 className="font-black text-white">{t.nome}</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Organizador de Eventos</p>
                    </div>
                  </div>
                </div>
              ))
            )}
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
            {loading.plans ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white/5 border border-white/10 p-12 rounded-[3rem] h-[500px] animate-pulse"></div>
              ))
            ) : (
              plans.map(p => {
                const features = [
                  `${p.limite_eventos === 0 ? 'Eventos Ilimitados' : p.limite_eventos + ' Evento(s) Ativo(s)'}`,
                  `${p.limite_midias === 0 ? 'Mídias Ilimitadas' : p.limite_midias + ' Mídias por Evento'}`,
                  "Moderação Realtime",
                  "QR Code Exclusivo",
                ];

                if (p.pode_baixar) {
                  features.push("Download em Lote");
                }

                return (
                  <PricingCard
                    key={p.id}
                    name={p.nome}
                    price={p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    recurrence={p.recorrencia}
                    featured={p.nome.toLowerCase().includes('pro')}
                    features={features}
                    buttonText={p.valor === 0 ? "Começar Agora" : "Assinar via Mercado Pago"}
                    onClick={() => handleSubscribe(p)}
                  />
                );
              })
            )}
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
            {(config.faq && config.faq.length > 0 ? config.faq : [
              { pergunta: "Precisa baixar algum aplicativo?", resposta: "Não! Toda a experiência do convidado é via navegador mobile." },
              { pergunta: "Como funciona a exibição no telão?", resposta: "O sistema gera um link exclusivo de exibição." }
            ]).map((item: any, i: number) => (
              <FAQItem key={i} question={item.pergunta} answer={item.resposta} />
            ))}
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
                {config.footer?.descricao || 'Redefinindo a experiência visual de eventos sociais e corporativos em tempo real.'}
              </p>
              <div className="flex gap-4">
                {config.contato.instagram && (
                  <a href={`https://instagram.com/${config.contato.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-primary/20 hover:border-primary/50 transition-all cursor-pointer">
                    <span className="material-symbols-outlined text-sm text-slate-400">link</span>
                  </a>
                )}
                {config.contato.telefone && (
                  <a href={`https://wa.me/${config.contato.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-primary/20 hover:border-primary/50 transition-all cursor-pointer">
                    <span className="material-symbols-outlined text-sm text-slate-400">chat</span>
                  </a>
                )}
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
                {config.contato.email && (
                  <a href={`mailto:${config.contato.email}`} className="text-sm text-slate-500 hover:text-white transition-colors">{config.contato.email}</a>
                )}
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
