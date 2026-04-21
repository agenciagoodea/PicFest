import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabaseService } from '../../services/supabaseService';
import { PlanAddonCatalog } from '../../types';

interface AddonCatalogProps {
    eventId: string;
    onSelect: (addon: PlanAddonCatalog) => void;
}

export const AddonCatalog: React.FC<AddonCatalogProps> = ({ eventId, onSelect }) => {
    const { data: addons = [], isLoading } = useQuery({
        queryKey: ['addonsCatalog'],
        queryFn: () => supabaseService.getAddonsCatalog(),
    });

    if (isLoading) return <div className="p-4 text-center animate-pulse text-[10px] uppercase font-black text-slate-500">Buscando pacotes...</div>;

    if (addons.length === 0) return (
        <div className="p-4 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">Nenhum pacote adicional disponível no momento.</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-3">
            {addons.map((addon) => (
                <div 
                    key={addon.id}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-primary/30 transition-all group shadow-lg"
                >
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-white uppercase tracking-tighter italic">{addon.name}</span>
                            {addon.price === 0 && <span className="bg-green-500 text-[8px] px-1.5 py-0.5 rounded text-white font-black">GRÁTIS</span>}
                        </div>
                        <p className="text-[9px] text-slate-500 leading-tight pr-4">{addon.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                             <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded">
                                {addon.extra_photos > 0 ? `+${addon.extra_photos} Fotos` : ''}
                                {addon.extra_photos > 0 && addon.extra_videos > 0 ? ' & ' : ''}
                                {addon.extra_videos > 0 ? `+${addon.extra_videos} Vídeos` : ''}
                             </span>
                        </div>
                    </div>
                    
                    <button
                        onClick={() => onSelect(addon)}
                        className="flex-shrink-0 bg-primary text-white p-2 px-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="text-[10px] font-black whitespace-nowrap">
                            R$ {Number(addon.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </button>
                </div>
            ))}
        </div>
    );
};
