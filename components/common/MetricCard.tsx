
import React from 'react';

interface MetricCardProps {
    label: string;
    value: string;
    sub: string;
    icon: string;
    color: string;
    progress?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, sub, icon, color, progress }) => (
    <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] flex flex-col gap-4 shadow-xl">
        <div className="flex justify-between items-start">
            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${color}`}>
                <span className="material-symbols-outlined !text-2xl">{icon}</span>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        </div>
        <div className="mt-2">
            <p className="text-4xl font-black tracking-tight">{value}</p>
            {progress !== undefined ? (
                <div className="w-full h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                </div>
            ) : (
                <p className={`text-[10px] font-black uppercase mt-1 ${sub.includes('+') ? 'text-green-500' : 'text-slate-500'}`}>{sub}</p>
            )}
        </div>
    </div>
);
