const fs = require('fs');
let c = fs.readFileSync('pages/dashboard/EventDetailView.tsx', 'utf8');

// 1. Botão Voltar – substituir Link por button
c = c.replace(
  'to="/dashboard/eventos" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">',
  'onClick={handleBack} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">'
);
// mudar tag <Link para <button e </Link> para </button> nessa linha
c = c.replace(/<Link (onClick=\{handleBack\}[^>]+>)/, '<button $1');
c = c.replace(/(<button onClick=\{handleBack\}[\s\S]{0,300}?)<\/Link>/, '$1</button>');

// 2. Galeria clicável
c = c.replace('media.map((m) => {', 'media.map((m, mediaIndex) => {');
c = c.replace(
  'className="group relative aspect-square bg-slate-900 rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all shadow-xl">',
  'onClick={() => setLightboxIndex(mediaIndex)} className="group relative aspect-square bg-slate-900 rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all shadow-xl cursor-pointer">'
);

// 3. Adicionar botão fullscreen antes dos botões de ação
const hoverDivTarget = '<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-20">';
const hoverDivReplacement = `<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-20">
                         <button
                            onClick={e => { e.stopPropagation(); setLightboxIndex(mediaIndex); }}
                            className="w-9 h-9 bg-white/20 text-white rounded-xl flex items-center justify-center hover:scale-110 transition-all mb-1"
                            title="Visualizar"
                         >
                            <span className="material-symbols-outlined text-sm">fullscreen</span>
                         </button>`;
c = c.replace(hoverDivTarget, hoverDivReplacement);

// Adicionar e.stopPropagation nos botões existentes de aprovar, excluir e link
c = c.replace(
  'onClick={() => handleApprove(m.id)}',
  'onClick={e => { e.stopPropagation(); handleApprove(m.id); }}'
);
c = c.replace(
  'onClick={() => handleDelete(m.id)}',
  'onClick={e => { e.stopPropagation(); handleDelete(m.id); }}'
);

// 4. Lightbox render antes do fechamento
const closing = '      </div>\n   );\n};\n';
if (c.includes(closing)) {
  c = c.replace(
    closing,
    `\n         {lightboxIndex !== null && (\n            <MediaLightbox\n               media={media as any}\n               initialIndex={lightboxIndex}\n               onClose={() => setLightboxIndex(null)}\n            />\n         )}\n      </div>\n   );\n};\n`
  );
}

fs.writeFileSync('pages/dashboard/EventDetailView.tsx', c, 'utf8');
console.log('Patch aplicado com sucesso!');
