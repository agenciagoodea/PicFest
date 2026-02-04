
import React from 'react';

interface FeatureCardProps {
    icon: string;
    title: string;
    desc: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc }) => (
    <div className="group p-10 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/[0.08] hover:border-primary/30 transition-all duration-500 shadow-xl">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-2xl">
            <span className="material-symbols-outlined !text-3xl">{icon}</span>
        </div>
        <h3 className="text-2xl font-black mt-8 mb-4 tracking-tight">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
);
