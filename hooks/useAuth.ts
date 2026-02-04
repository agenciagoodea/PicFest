import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { Profile } from '../types';

export const useAuth = () => {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Verificar sessão atual
        checkUser();

        // Listener de mudanças de autenticação
        const { unsubscribe } = authService.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const { profile } = await authService.getCurrentUser();
                setUser(session.user);
                setProfile(profile);
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const checkUser = async () => {
        try {
            const { user: currentUser, profile: currentProfile } = await authService.getCurrentUser();
            setUser(currentUser);
            setProfile(currentProfile);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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
