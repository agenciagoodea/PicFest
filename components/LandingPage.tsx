
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { Depoimento } from '../types';

export const LandingPage: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Depoimento[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    supabaseService.getTestimonials(true).then(setTestimonials);
  }, []);

  const navLinks = [
    { href: "#features", label: "Recursos" },
    { href: "#testimonials", label: "Depoimentos" },
    { href: "#pricing", label: "Preços" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <div className="min-h-screen bg-background-dark text-white font-sans selection:bg-primary selection:text-white overflow-x-hidden">
      {/* Background Decorativo Global */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[140px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full"></div>
      </div>

      {/* Navbar Premium Responsiva */}
      <header className="fixed top-0 z-[100] w-full px-4 md:px-10 py-4 md:py-6">
        <div className="max-w-[1400px] mx-auto bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] md:rounded-[2rem] px-4 md:px-8 py-3 md:py-4 flex items-center justify-between shadow-2xl relative">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-sm md:text-base">auto_awesome_motion</span>
            </div>
            <h2 className="text-lg md:text-xl font-black tracking-tighter uppercase italic">PicFest</h2>
          </div>
          
          {/* Menu Desktop */}
          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">{link.label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <Link to="/login" className="hidden sm:block px-4 md:px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all">Login</Link>
            <Link to="/register" className="px-5 md:px-8 py-2.5 md:py-3 text-[10px] font-black uppercase tracking-widest bg-primary text-white rounded-xl shadow-xl shadow-primary/20 hover:scale-105 transition-all">Começar Agora</Link>
            
            {/* Botão Menu Mobile */}
            <button 
              className="lg:hidden w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="material-symbols-outlined">{isMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>

          {/* Menu Mobile Dropdown */}
          {isMenuOpen && (
            <div className="absolute top-[calc(100%+1rem)] left-0 w-full bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 lg:hidden flex flex-col gap-4 animate-in slide-in-from-top-4">
              {navLinks.map(link => (
                <a 
                  key={link.href} 
                  href={link.href} 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-4 bg-white/5 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-300"
                >
                  {link.label}
                </a>
              ))}
              <Link to="/login" className="p-4 bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-center">Login</Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 md:pt-44 pb-20 md:pb-32 px-6 flex flex-col items-center text-center overflow-hidden">
        <div className="max-w-[1000px] flex flex-col items-center gap-8 md:gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-3 px-4 md:px-5 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            SaaS de Fotos em Tempo Real
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black leading-[1.1] md:leading-[0.9] tracking-tighter">
            SUA FESTA NO <br />
            <span className="text-primary italic">TELÃO</span> EM REALTIME
          </h1>
          
          <p className="text-base md:text-xl text-slate-400 max-w-[700px] leading-relaxed font-medium">
            Transforme cada convidado em um fotógrafo oficial. Capture sorrisos e momentos únicos e exiba instantaneamente com nossa tecnologia ultra-rápida.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 mt-4 w-full sm:w-auto">
            <Link to="/register" className="w-full sm:w-auto px-10 md:px-12 py-4 md:py-5 bg-primary text-white font-black rounded-[1.2rem] md:rounded-[1.5rem] text-xs md:text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-center">
              Começar Grátis
            </Link>
            <a href="#features" className="w-full sm:w-auto px-10 md:px-12 py-4 md:py-5 bg-white/5 border border-white/10 font-black rounded-[1.2rem] md:rounded-[1.5rem] text-xs md:text-sm uppercase tracking-widest hover:bg-white/10 transition-all text-center">
              Como Funciona
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 py-20 md:py-32 px-6 overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16 md:mb-20">
             <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-4">Depoimentos</h2>
             <p className="text-3xl md:text-5xl font-black tracking-tight italic">O que os organizadores dizem</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {testimonials.length > 0 ? testimonials.map(t => (
              <div key={t.id} className="bg-white/5 border border-white/10 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] flex flex-col gap-6 backdrop-blur-3xl shadow-2xl hover:bg-white/[0.08] transition-all group">
                <div className="flex justify-between items-start">
                   <div className="flex gap-1 text-primary">
                      {Array.from({ length: t.estrelas }).map((_, i) => (
                        <span key={i} className="material-symbols-outlined !text-lg md:!text-xl fill-1">star</span>
                      ))}
                   </div>
                   <span className="material-symbols-outlined text-white/10 !text-4xl md:!text-5xl group-hover:text-primary/20 transition-colors">format_quote</span>
                </div>
                <p className="text-base md:text-lg font-medium text-slate-300 italic leading-relaxed">"{t.texto}"</p>
                <div className="flex items-center gap-4 mt-4">
                  <img src={t.foto_url} className="w-12 h-12 md:w-14 md:h-14 rounded-2xl border-2 border-primary/20 object-cover" alt={t.nome} />
                  <div>
                    <h4 className="font-black text-white text-sm md:text-base">{t.nome}</h4>
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Organizador de Eventos</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                Seja o primeiro organizador a avaliar!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-20 md:py-32 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16 md:mb-20">
             <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-4">Funcionalidades</h2>
             <p className="text-3xl md:text-5xl font-black tracking-tight">Potencialize seu Evento</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard 
              icon="qr_code_2" 
              title="Acesso via QR Code" 
              desc="Sem apps. Seus convidados escaneiam e começam a enviar mídias instantaneamente." 
            />
            <FeatureCard 
              icon="bolt" 
              title="Tempo Real" 
              desc="Mídias aparecem no telão assim que o upload for concluído, sem recarregar a página." 
            />
            <FeatureCard 
              icon="verified_user" 
              title="Moderação" 
              desc="Controle total sobre o que aparece no telão com nosso painel de curadoria intuitivo." 
            />
            <FeatureCard 
              icon="tv" 
              title="Telão Premium" 
              desc="Layouts dinâmicos que valorizam cada foto e vídeo enviado pelos seus convidados." 
            />
            <FeatureCard 
              icon="cloud_download" 
              title="Download em Lote" 
              desc="Baixe todas as recordações do evento em um único arquivo de alta qualidade." 
            />
            <FeatureCard 
              icon="credit_card" 
              title="Pagamento PIX" 
              desc="Integração Mercado Pago com liberação automática de recursos após o pagamento." 
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-20 md:py-32 px-6">
        <div className="max-w-[1400px] mx-auto">
           <div className="text-center mb-16 md:mb-20">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Planos Flexíveis</h2>
              <p className="text-slate-500 font-medium">Ideal para aniversários, casamentos e eventos corporativos.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1100px] mx-auto">
              <PricingCard 
                name="Básico" 
                price="0" 
                features={["1 Evento", "50 Mídias", "Moderação Básica"]} 
                buttonText="Começar Grátis"
                buttonTo="/register"
              />
              <PricingCard 
                name="Pro" 
                price="49,90" 
                featured={true}
                features={["10 Eventos", "Mídias Ilimitadas", "Moderação Realtime", "Download HD"]} 
                buttonText="Assinar via MP"
                buttonTo="/register"
              />
              <PricingCard 
                name="VIP" 
                price="199,00" 
                features={["Eventos Ilimitados", "Suporte 24h", "White-label", "Faturas em PDF"]} 
                buttonText="Falar com Vendas"
                buttonTo="/register"
              />
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 pt-20 pb-10 px-6 border-t border-white/5 bg-background-dark/80">
         <div className="max-w-[1400px] mx-auto flex flex-col gap-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
               <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-xs">auto_awesome_motion</span>
                    </div>
                    <h2 className="text-lg font-black tracking-tighter uppercase italic">PicFest</h2>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
                     Redefinindo a experiência visual de eventos sociais e corporativos em tempo real.
                  </p>
               </div>
               
               <div className="flex flex-col gap-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Produto</h4>
                  <a href="#" className="text-xs text-slate-500 hover:text-white transition-colors">Funcionalidades</a>
                  <a href="#" className="text-xs text-slate-500 hover:text-white transition-colors">Preços</a>
                  <a href="#" className="text-xs text-slate-500 hover:text-white transition-colors">Segurança</a>
               </div>

               <div className="flex flex-col gap-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Empresa</h4>
                  <a href="#" className="text-xs text-slate-500 hover:text-white transition-colors">Sobre Nós</a>
                  <a href="#" className="text-xs text-slate-500 hover:text-white transition-colors">Suporte</a>
                  <a href="#" className="text-xs text-slate-500 hover:text-white transition-colors">Contato</a>
               </div>

               <div className="flex flex-col gap-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Jurídico</h4>
                  <a href="#" className="text-xs text-slate-500 hover:text-white transition-colors">Termos de Uso</a>
                  <a href="#" className="text-xs text-slate-500 hover:text-white transition-colors">Privacidade</a>
               </div>
            </div>

            <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">
               <p>© 2024 PicFest SaaS. Todos os direitos reservados.</p>
               <p>Desenvolvido no Brasil 🇧🇷</p>
            </div>
         </div>
      </footer>
    </div>
  );
};

/* --- SUB-COMPONENTES DESIGN SYSTEM --- */

const FeatureCard = ({ icon, title, desc }: { icon: string; title: string; desc: string }) => (
  <div className="group p-8 md:p-10 bg-white/5 border border-white/10 rounded-[2rem] md:rounded-[2.5rem] hover:bg-white/[0.08] hover:border-primary/30 transition-all duration-500 shadow-xl">
    <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
      <span className="material-symbols-outlined !text-2xl md:!text-3xl">{icon}</span>
    </div>
    <h3 className="text-xl md:text-2xl font-black mt-6 md:mt-8 mb-4 tracking-tight">{title}</h3>
    <p className="text-slate-500 text-xs md:text-sm leading-relaxed">{desc}</p>
  </div>
);

const PricingCard = ({ name, price, features, buttonText, buttonTo, featured }: { name: string; price: string; features: string[]; buttonText: string; buttonTo: string; featured?: boolean }) => (
  <div className={`p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border flex flex-col gap-6 md:gap-8 transition-all hover:translate-y-[-8px] duration-500 shadow-2xl relative ${featured ? 'bg-primary border-primary ring-4 md:ring-8 ring-primary/10 scale-100 md:scale-105' : 'bg-white/5 border-white/10'}`}>
     {featured && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-primary text-[8px] md:text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl">Mais Popular</span>}
     <div>
        <h4 className={`text-sm md:text-xl font-black uppercase tracking-widest mb-4 ${featured ? 'text-white/80' : 'text-slate-500'}`}>{name}</h4>
        <div className="flex items-baseline gap-1">
           <span className="text-3xl md:text-5xl font-black italic tracking-tighter">R$ {price}</span>
           <span className={`text-[10px] md:text-sm font-bold ${featured ? 'text-white/60' : 'text-slate-600'}`}>/mês</span>
        </div>
     </div>
     <div className={`h-px ${featured ? 'bg-white/20' : 'bg-white/5'}`}></div>
     <ul className="flex flex-col gap-4 md:gap-5 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-xs md:text-sm font-medium">
             <span className={`material-symbols-outlined text-sm md:text-base ${featured ? 'text-white' : 'text-primary'}`}>check_circle</span>
             <span className={featured ? 'text-white' : 'text-slate-300'}>{f}</span>
          </li>
        ))}
     </ul>
     <Link to={buttonTo} className={`w-full py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-xs shadow-2xl transition-all active:scale-95 text-center ${featured ? 'bg-white text-primary hover:bg-slate-100' : 'bg-primary text-white shadow-primary/20 hover:scale-105'}`}>
        {buttonText}
     </Link>
  </div>
);
