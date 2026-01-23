
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { OrganizerDashboard } from './components/OrganizerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { LiveDisplay } from './components/LiveDisplay';
import { GuestUpload } from './components/GuestUpload';
import { UserRole } from './types';

// Contexto simples para Auth (Simulado)
export const AuthContext = React.createContext<{
  user: any;
  role: UserRole | null;
  login: (role: UserRole) => void;
  logout: () => void;
}>({
  user: null,
  role: null,
  login: () => {},
  logout: () => {}
});

const DemoHelper = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">
      {isOpen && (
        <div className="bg-white dark:bg-slate-900 border border-primary/20 p-4 rounded-2xl shadow-2xl flex flex-col gap-2 min-w-[200px] animate-in slide-in-from-bottom-5">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 border-b border-primary/10 pb-1">Atalhos de Demo</p>
          <Link to="/" className="text-sm hover:text-primary flex items-center gap-2"><span className="material-symbols-outlined text-sm">home</span> Home</Link>
          <Link to="/dashboard" className="text-sm hover:text-primary flex items-center gap-2"><span className="material-symbols-outlined text-sm">dashboard</span> Dashboard Org</Link>
          <Link to="/evento/123456" className="text-sm hover:text-primary flex items-center gap-2"><span className="material-symbols-outlined text-sm">add_a_photo</span> Convidado (Upload)</Link>
          <Link to="/live/123456" className="text-sm hover:text-primary flex items-center gap-2"><span className="material-symbols-outlined text-sm">tv</span> Telão (Live)</Link>
          <Link to="/admin" className="text-sm hover:text-primary flex items-center gap-2"><span className="material-symbols-outlined text-sm">admin_panel_settings</span> Admin SaaS</Link>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
      >
        <span className="material-symbols-outlined">{isOpen ? 'close' : 'explore'}</span>
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  const login = (newRole: UserRole) => {
    setUser({ id: 'current-user', nome: 'Usuário Demo' });
    setRole(newRole);
  };

  const logout = () => {
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout }}>
      <Router>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/evento/:slug" element={<GuestUpload />} />
          <Route path="/live/:slug" element={<LiveDisplay />} />

          {/* Dashboards (Proteção simulada no componente) */}
          <Route path="/dashboard/*" element={<OrganizerDashboard />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
        <DemoHelper />
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
