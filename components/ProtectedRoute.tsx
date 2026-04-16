import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../App';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'admin' | 'organizador' | 'convidado';
    redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredRole,
    redirectTo = '/login',
}) => {
    const { user, profile, loading } = useContext(AuthContext);

    // Mostrar loading enquanto verifica autenticação ou carrega perfil
    if (loading) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Verificando Acesso...</p>
                </div>
            </div>
        );
    }

    // Redirecionar para login se não estiver autenticado
    if (!user) {
        return <Navigate to={redirectTo} replace />;
    }

    // Verificar role se especificado
    if (requiredRole && profile?.role !== requiredRole) {
        // Se temos usuário mas NÃO temos perfil (ou role errada), verificamos se 
        // o perfil realmente existe antes de redirecionar para a home.
        if (!profile) {
            // Se o perfil ainda é nulo após o loading, mostramos uma tela de espera 
            // ou permitimos (se o usuário for novo). Aqui, vamos aguardar mais um pouco.
            return (
                <div className="min-h-screen bg-background-dark flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Sincronizando Perfil...</p>
                    </div>
                </div>
            );
        }

        // Se o perfil existe mas a role é diferente, aí sim redirecionamos
        // LOW-03: Garantir que convidados não ficam presos em loop de loading
        if (profile.role === 'admin') {
            return <Navigate to="/admin" replace />;
        } else if (profile.role === 'organizador') {
            return <Navigate to="/dashboard" replace />;
        } else {
            // Convidados e roles desconhecidas vão para a home
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};
