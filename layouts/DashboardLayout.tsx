
import React, { ReactNode, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';

interface LayoutProps {
    children: ReactNode;
    menuItems: Array<{ path: string; label: string; icon: string }>;
    title: string;
    icon: string;
}

export const DashboardLayout: React.FC<LayoutProps> = ({ children, menuItems, title, icon }) => {
    const { user, profile, logout } = useContext(AuthContext);
    const location = useLocation();

    return (
        <div className="flex h-screen overflow-hidden bg-background-dark text-white font-sans">
            <aside className="w-72 border-r border-white/5 bg-black/40 backdrop-blur-2xl p-6 flex flex-col gap-10">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-white">{icon}</span>
                    </div>
                    <h2 className="font-black text-xl tracking-tighter">{title}</h2>
                </div>

                <nav className="flex flex-col gap-1 flex-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 p-3.5 rounded-xl transition-all font-semibold text-sm ${location.pathname === item.path
                                ? 'bg-primary text-white shadow-lg shadow-primary/10'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className="material-symbols-outlined !text-xl">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex flex-col gap-4">
                    <Link
                        to={title.includes('Admin') ? '/admin/perfil' : '/dashboard/perfil'}
                        className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3 group relative hover:border-primary/50 transition-all"
                    >
                        <div className="w-10 h-10 rounded-full border-2 border-primary/50 overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                            {profile?.foto_perfil ? (
                                <img src={profile.foto_perfil} className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-slate-500">person</span>
                            )}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-xs font-bold truncate text-white">{profile?.nome || 'Usuário PicFest'}</p>
                            {profile?.instagram ? (
                                <p className="text-[10px] text-primary font-bold truncate">@{profile.instagram.replace('@', '')}</p>
                            ) : (
                                <p className="text-[10px] text-slate-500 uppercase font-black">Meu Perfil</p>
                            )}
                        </div>
                        <button onClick={(e) => { e.preventDefault(); logout(); }} className="text-slate-500 hover:text-red-500 transition-colors shrink-0">
                            <span className="material-symbols-outlined text-sm">logout</span>
                        </button>
                    </Link>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto p-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
                {children}
            </main>
        </div>
    );
};
