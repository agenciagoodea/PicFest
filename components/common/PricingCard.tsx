
import React from 'react';

interface PricingCardProps {
    name: string;
    price: string;
    features: string[];
    buttonText: string;
    featured?: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({ name, price, features, buttonText, featured }) => (
    <div className={`p-12 rounded-[3rem] border flex flex-col gap-8 transition-all hover:translate-y-[-8px] duration-500 shadow-2xl ${featured ? 'bg-primary border-primary ring-8 ring-primary/10 relative scale-105' : 'bg-white/5 border-white/10'}`}>
        {featured && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-primary text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl">Mais Popular</span>}
        <div>
            <h4 className={`text-xl font-black uppercase tracking-widest mb-4 ${featured ? 'text-white/80' : 'text-slate-500'}`}>{name}</h4>
            <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black italic tracking-tighter">R$ {price}</span>
                <span className={`text-sm font-bold ${featured ? 'text-white/60' : 'text-slate-600'}`}>/mês</span>
            </div>
        </div>
        <div className={`h-px ${featured ? 'bg-white/20' : 'bg-white/5'}`}></div>
        <ul className="flex flex-col gap-5 flex-1">
            {features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium">
                    <span className={`material-symbols-outlined text-sm ${featured ? 'text-white' : 'text-primary'}`}>check_circle</span>
                    <span className={featured ? 'text-white' : 'text-slate-300'}>{f}</span>
                </li>
            ))}
        </ul>
        <button className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95 ${featured ? 'bg-white text-primary hover:bg-slate-100' : 'bg-primary text-white shadow-primary/20 hover:scale-105'}`}>
            {buttonText}
        </button>
    </div>
);
