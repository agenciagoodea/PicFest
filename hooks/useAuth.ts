import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { Profile } from '../types';

export const useAuth = () => {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        // Verificação imediata da sessão atual para evitar dependência exclusiva do evento
        const checkInitialSession = async () => {
            const { user: currentUser, profile: currentProfile } = await authService.getCurrentUser();
            if (isMounted) {
                if (currentUser) {
                    setUser(currentUser);
                    setProfile(currentProfile);
                }
                setLoading(false);
            }
        };

        checkInitialSession();

        // Listener de mudanças de autenticação
        const { unsubscribe } = authService.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;

            if (session?.user) {
                // Se já temos o perfil e o usuário não mudou, evitamos reload desnecessário
                if (user?.id === session.user.id && profile) {
                    setLoading(false);
                    return;
                }

                // Passamos a sessão recebida diretamente para evitar novo getSession()
                const { profile: updatedProfile } = await authService.getCurrentUser(session);
                if (isMounted) {
                    setUser(session.user);
                    setProfile(updatedProfile);
                    setLoading(false);
                }
            } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
                if (isMounted) {
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                }
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
