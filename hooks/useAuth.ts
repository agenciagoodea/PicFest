import { useState, useEffect, useRef } from 'react';
import { authService } from '../services/authService';
import { Profile } from '../types';

export const useAuth = () => {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Refs para controle de deduplicação (valores síncronos)
    const activeUserRef = useRef<any>(null);
    const activeProfileRef = useRef<Profile | null>(null);
    const isInitialSessionProcessed = useRef(false);

    useEffect(() => {
        let isMounted = true;

        // Função única para sincronizar estado
        const syncAuth = async (session: any) => {
            if (!session?.user) {
                activeUserRef.current = null;
                activeProfileRef.current = null;
                if (isMounted) {
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                }
                return;
            }

            // DEDUPLICAÇÃO: Se já temos o perfil carregado para este ID de usuário, não repetimos a busca
            if (activeUserRef.current?.id === session.user.id && activeProfileRef.current) {
                console.log('[useAuth] Ignorando fetch redundante para:', session.user.email);
                if (isMounted) setLoading(false);
                return;
            }

            try {
                // Se chegamos aqui, precisamos buscar o perfil (ex: carga inicial ou refresh de token)
                const { profile: updatedProfile } = await authService.getCurrentUser(session);
                
                if (isMounted) {
                    activeUserRef.current = session.user;
                    activeProfileRef.current = updatedProfile;
                    
                    setUser(session.user);
                    setProfile(updatedProfile);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Erro ao sincronizar auth:', err);
                if (isMounted) setLoading(false);
            }
        };

        // Escuta mudanças de auth (o INITIAL_SESSION do Supabase cuida da carga inicial)
        const { unsubscribe } = authService.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;
            
            console.log(`[useAuth] Evento: ${event}`);
            
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
                syncAuth(session);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        const result = await authService.signIn(email, password);
        if (result.error) {
            setError(result.error);
        } else {
            // Sincroniza refs IMEDIATAMENTE antes do listener 'onAuthStateChange' disparar o evento SIGNED_IN
            activeUserRef.current = result.user;
            activeProfileRef.current = result.profile;
            
            setUser(result.user);
            setProfile(result.profile);
        }
        setLoading(false);
        return result;
    };

    const signUp = async (email: string, password: string, userData: { nome: string; role?: 'organizador' | 'convidado' }) => {
        setLoading(true);
        setError(null);
        const result = await authService.signUp(email, password, userData);
        if (result.error) {
            setError(result.error);
        } else if (result.user && result.profile) {
            // Sincroniza refs IMEDIATAMENTE para evitar deduplicação no listener
            activeUserRef.current = result.user;
            activeProfileRef.current = result.profile;
            
            setUser(result.user);
            setProfile(result.profile);
        }
        setLoading(false);
        return result;
    };

    const signOut = async () => {
        setLoading(true);
        const result = await authService.signOut();
        if (!result.error) {
            setUser(null);
            setProfile(null);
        }
        setLoading(false);
        return result;
    };

    return {
        user,
        profile,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
        isAdmin: profile?.role === 'admin',
        isOrganizer: profile?.role === 'organizador',
        isGuest: profile?.role === 'convidado',
    };
};
