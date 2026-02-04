import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
    const { user, profile, loading } = useAuth();

    // Mostrar loading enquanto verifica autenticação
    if (loading) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white font-bold">Carregando...</p>
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
        // Redirecionar para dashboard apropriado baseado na role
        if (profile?.role === 'admin') {
            return <Navigate to="/admin" replace />;
        } else if (profile?.role === 'organizador') {
            return <Navigate to="/dashboard" replace />;
        } else {
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};
