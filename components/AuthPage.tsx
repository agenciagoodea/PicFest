
import React, { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login('organizador');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      {/* Esquerda: Imagem */}
      <div className="hidden lg:flex flex-1 bg-cover bg-center relative" style={{ backgroundImage: 'url(https://picsum.photos/1200/1200?wedding)' }}>
         <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col justify-end p-20">
            <h1 className="text-5xl font-black text-white leading-tight">Eventos memoráveis começam aqui.</h1>
            <p className="text-slate-200 text-xl mt-4">Junte-se a milhares de organizadores de eventos de elite.</p>
         </div>
      </div>

      {/* Direita: Form */}
      <div className="flex-1 bg-background-dark flex items-center justify-center p-8">
         <div className="w-full max-w-[400px] flex flex-col gap-10">
            <Link to="/" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary !text-3xl">auto_awesome_motion</span>
              <h2 className="text-xl font-bold">PicFest</h2>
            </Link>

            <div className="flex flex-col gap-2">
              <h2 className="text-4xl font-black">{mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
              <p className="text-slate-500">Entre com seus dados para gerenciar seus eventos.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === 'register' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                  <input type="text" className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 focus:ring-primary focus:border-primary" placeholder="João da Silva" />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
                <input type="email" required className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 focus:ring-primary focus:border-primary" placeholder="joao@exemplo.com" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Senha</label>
                <input type="password" required className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 focus:ring-primary focus:border-primary" placeholder="••••••••" />
              </div>
              
              <button type="submit" className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-xl shadow-primary/20 mt-4">
                 {mode === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>
            </form>

            <div className="text-center text-sm text-slate-500">
               {mode === 'login' ? (
                 <>Ainda não tem conta? <Link to="/register" className="text-primary font-bold">Cadastre-se</Link></>
               ) : (
                 <>Já tem uma conta? <Link to="/login" className="text-primary font-bold">Faça login</Link></>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};
