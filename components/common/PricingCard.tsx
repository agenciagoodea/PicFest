
import React from 'react';

interface PricingFeature {
  text: string;
  locked?: boolean;
}

interface PricingCardProps {
  name: string;
  price: string;
  features: (string | PricingFeature)[];
  buttonText: string;
  featured?: boolean;
  onClick?: () => void;
  recurrence?: string;
  badge?: string;
  description?: string;
  disabled?: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  name,
  price,
  features,
  buttonText,
  featured,
  onClick,
  recurrence,
  badge,
  description,
  disabled
}) => {
  const isFree = price === '0,00' || price === '0.00' || parseFloat(price.replace(',', '.')) === 0;
  const isPerEvent = recurrence === 'Por Evento' || recurrence === 'evento';

  // Normaliza features para PricingFeature
  const normalizedFeatures: PricingFeature[] = features.map(f =>
    typeof f === 'string' ? { text: f, locked: false } : f
  );

  return (
    <div className={`
      p-10 rounded-[3rem] border flex flex-col gap-8 transition-all duration-500 shadow-2xl relative
      ${featured
        ? 'bg-primary border-primary ring-8 ring-primary/10 scale-105 hover:translate-y-[-8px]'
        : 'bg-white/5 border-white/10 hover:border-white/20 hover:translate-y-[-8px]'}
    `}>
      {/* Badge de destaque */}
      {featured && !badge && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-primary text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl whitespace-nowrap">
          ⭐ Mais Popular
        </span>
      )}
      {badge && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl whitespace-nowrap">
          {badge}
        </span>
      )}

      {/* Nome e modelo */}
      <div className="flex items-start justify-between gap-2">
        <h4 className={`text-xl font-black uppercase tracking-widest ${featured ? 'text-white/80' : 'text-slate-500'}`}>
          {name}
        </h4>
        {isPerEvent && (
          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase whitespace-nowrap
            ${featured ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'}`}>
            Por Evento
          </span>
        )}
      </div>

      {/* Preço */}
      <div>
        <div className="flex items-baseline gap-1">
          {isFree ? (
            <span className="text-5xl font-black italic tracking-tighter">Grátis</span>
          ) : (
            <>
              <span className={`text-[13px] font-bold self-start mt-2 ${featured ? 'text-white/60' : 'text-slate-500'}`}>R$</span>
              <span className="text-5xl font-black italic tracking-tighter">{price}</span>
              <span className={`text-sm font-bold ${featured ? 'text-white/60' : 'text-slate-600'}`}>
                {isPerEvent ? ' /evento' : `/${recurrence || 'mês'}`}
              </span>
            </>
          )}
        </div>
        {description && (
          <p className={`text-xs mt-2 font-medium ${featured ? 'text-white/60' : 'text-slate-500'}`}>
            {description}
          </p>
        )}
      </div>

      <div className={`h-px ${featured ? 'bg-white/20' : 'bg-white/5'}`}></div>

      {/* Features */}
      <ul className="flex flex-col gap-4 flex-1">
        {normalizedFeatures.map((f, i) => (
          <li key={i} className={`flex items-center gap-3 text-sm font-medium ${f.locked ? 'opacity-40' : ''}`}>
            <span className={`material-symbols-outlined text-sm flex-shrink-0
              ${f.locked ? 'text-slate-600' : (featured ? 'text-white' : 'text-primary')}`}>
              {f.locked ? 'lock' : 'check_circle'}
            </span>
            <span className={featured ? 'text-white' : 'text-slate-300'}>{f.text}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95
          ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
          ${featured
            ? 'bg-white text-primary hover:bg-slate-100'
            : 'bg-primary text-white shadow-primary/20 hover:scale-105'}
        `}
      >
        {buttonText}
      </button>
    </div>
  );
};
