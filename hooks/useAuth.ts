import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { supabaseService } from '../services/supabaseService';
import { Profile } from '../types';

export const useAuth = () => {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const queryClient = useQueryClient();

    // Refs para controle de deduplicação (valores síncronos)
    const activeUserRef = useRef<any>(null);
    const activeProfileRef = useRef<Profile | null>(null);
    const isInitialSessionProcessed = useRef(false);
    const isSyncing = useRef(false); // Flag para evitar processamento paralelo de auth

    // Chave para persistência local do perfil
    const PROFILE_STORAGE_KEY = 'picfest_cached_profile';

    useEffect(() => {
        let isMounted = true;

        const syncAuth = async (session: any) => {
            // BLOQUEIO DE DUPLICIDADE: Se já estamos sincronizando, ignoramos novos eventos
            // a menos que sejam de logout (session null)
            if (isSyncing.current && session?.user) {
                return;
            }

            if (!session?.user) {
                activeUserRef.current = null;
                activeProfileRef.current = null;
                isSyncing.current = false;
                localStorage.removeItem(PROFILE_STORAGE_KEY);
                if (isMounted) {
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                }
                return;
            }

            // DEDUPLICAÇÃO DE DADOS: Se o usuário é o mesmo e já temos o perfil, não fazemos nada
            if (activeUserRef.current?.id === session.user.id && activeProfileRef.current) {
                if (isMounted) setLoading(false);
                return;
            }

            isSyncing.current = true;

            // TENTATIVA DE HIDRATAÇÃO RÁPIDA (INSTANTÂNEA)
            if (!activeProfileRef.current) {
                const cached = localStorage.getItem(PROFILE_STORAGE_KEY);
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        if (parsed && parsed.id === session.user.id) {
                            console.log('[useAuth] ⚡ Perfil hidratado via Cache Local');
                            activeProfileRef.current = parsed;
                            if (isMounted) {
                                setProfile(parsed);
                                setUser(session.user);
                            }
                        }
                    } catch (e) {
                        localStorage.removeItem(PROFILE_STORAGE_KEY);
                    }
                }
            }

            try {
                let { profile: updatedProfile } = await authService.getCurrentUser(session);
                
                // RESGATE DE PERFIL: Se o usuário logou mas não tem perfil (novo ou erro de trigger)
                if (isMounted && !updatedProfile && session.user) {
                    console.log('[useAuth] 🚑 Iniciando Resgate de Perfil...');
                    const rescueResult = await authService.createProfile(session.user, { 
                        nome: session.user.email?.split('@')[0] || 'Organizador',
                        role: 'organizador' 
                    });
                    if (rescueResult.profile) {
                        updatedProfile = rescueResult.profile as Profile;
                    }
                }

                if (isMounted && updatedProfile) {
                    activeUserRef.current = session.user;
                    activeProfileRef.current = updatedProfile;
                    
                    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
                    
                    // PRE-FETCH PROATIVO: Antecipa dados basedo no role
                    if (updatedProfile.role === 'organizador') {
                        queryClient.prefetchQuery({
                            queryKey: ['userSubscription', session.user.id],
                            queryFn: () => supabaseService.getUserSubscription(session.user.id),
                        });
                        queryClient.prefetchQuery({
                            queryKey: ['organizerStats', session.user.id],
                            queryFn: () => supabaseService.getOrganizerStats(session.user.id),
                        });
                    }
                    
                    setUser(session.user);
                    setProfile(updatedProfile);
                    setLoading(false);
                } else if (isMounted) {
                    setLoading(false);
                }
            } catch (err) {
                console.error('Erro ao sincronizar auth:', err);
                if (isMounted) setLoading(false);
            } finally {
                isSyncing.current = false;
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
            
            if (result.profile) {
                localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(result.profile));
            }
            
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
