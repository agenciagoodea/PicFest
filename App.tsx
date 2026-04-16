import React, { useState, Suspense, lazy, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import { UserRole } from './types';

// Lazy Loading de páginas para melhor performance
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const OrganizerDashboard = lazy(() => import('./pages/OrganizerDashboard').then(m => ({ default: m.OrganizerDashboard })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const LiveDisplay = lazy(() => import('./pages/LiveDisplay').then(m => ({ default: m.LiveDisplay })));
const GuestUpload = lazy(() => import('./pages/GuestUpload').then(m => ({ default: m.GuestUpload })));

// Componente de Loading elegante
const PageLoader = () => (
  <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Carregando PicFest...</p>
  </div>
);

// Contexto de Auth (agora usando o hook real)
export const AuthContext = React.createContext<{
  user: any;
  profile: any;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, userData: any) => Promise<any>;
  logout: () => void;
}>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  signIn: async () => { },
  signUp: async () => { },
  logout: () => { }
});

const App: React.FC = () => {
  const auth = useAuth();
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  // Memoizar contexto para evitar re-renders desnecessários em toda a árvore
  const authContextValue = useMemo(() => ({
    user: auth.user,
    profile: auth.profile,
    role: auth.profile?.role || null,
    loading: auth.loading,
    signIn: auth.signIn,
    signUp: auth.signUp,
    logout: auth.signOut,
  }), [auth.user, auth.profile, auth.loading]);

  // Efeito para marcar o fim da carga inicial
  React.useEffect(() => {
    if (!auth.loading) {
      setInitialCheckComplete(true);
    }
  }, [auth.loading]);

  // Mostrar loader geral apenas na PRIMEIRA carga do sistema para estabilizar auth
  // Depois que o primeiro check completa, usamos o loading dentro das rotas/botões
  if (!initialCheckComplete && auth.loading) {
    return <PageLoader />;
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Públicas */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/evento/:slug" element={<GuestUpload />} />
            <Route path="/live/:slug" element={<LiveDisplay />} />

            {/* Dashboards Protegidos */}
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute requiredRole="organizador">
                  <OrganizerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
