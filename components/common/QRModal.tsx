import React, { useState } from 'react';
import { Evento } from '../../types';
import { TableCardGenerator } from '../dashboard/TableCardGenerator';

interface QRModalProps {
	event: Evento;
	onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({ event, onClose }) => {
	const [view, setView] = useState<'visualizer' | 'print_config' | 'printable'>('visualizer');
	const [printConfig, setPrintConfig] = useState({
		quantity: 12,
		message: 'Escaneie para capturar e compartilhar as memórias de hoje!',
		showLogo: true
	});

	if (view === 'printable') {
		return (
			<div className="fixed inset-0 z-[300] bg-white overflow-auto">
				<button 
					onClick={() => setView('print_config')}
					className="no-print fixed top-6 right-6 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-[60]"
				>
					<span className="material-symbols-outlined">close</span>
				</button>
				<TableCardGenerator event={event} config={printConfig} />
			</div>
		);
	}

	return (
		<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
			<div className="bg-slate-900 border border-white/10 p-10 rounded-[3rem] max-w-xl w-full relative shadow-2xl scale-in-center">
				<button
					onClick={onClose}
					className="absolute top-6 right-6 w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
				>
					<span className="material-symbols-outlined">close</span>
				</button>

				{view === 'visualizer' ? (
					<div className="text-center flex flex-col items-center">
						<div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-6">
							<span className="material-symbols-outlined !text-3xl">qr_code_2</span>
						</div>

						<h3 className="text-3xl font-black text-white mb-1 uppercase italic tracking-tighter">{event.nome}</h3>
						<p className="text-slate-500 text-[10px] mb-8 font-black uppercase tracking-[0.3em]">Live Experience by PicFest</p>

						<div className="bg-white p-8 rounded-[3rem] shadow-inner mb-8 w-fit group relative overflow-hidden">
							<img
								src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/#/evento/' + event.slug_curto)}&color=000000&bgcolor=ffffff`}
								className="w-56 h-56"
								alt="QR Code"
							/>
							<div className="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
								<a 
									href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(window.location.origin + '/#/evento/' + event.slug_curto)}&color=000000&bgcolor=ffffff&format=png&download=1`}
									download={`qrcode-${event.slug_curto}.png`}
									className="bg-primary text-white p-4 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
								>
									<span className="material-symbols-outlined">download</span> Download PNG
								</a>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 w-full gap-4">
							<div className="bg-white/5 p-4 rounded-2xl flex items-center justify-between gap-3 border border-white/5">
								<div className="text-left overflow-hidden">
									<p className="text-[9px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Link Direto</p>
									<p className="text-xs text-primary font-bold truncate">.../evento/{event.slug_curto}</p>
								</div>
								<button
									onClick={() => {
										navigator.clipboard.writeText(`${window.location.origin}/#/evento/${event.slug_curto}`);
										alert('Link copiado!');
									}}
									className="w-10 h-10 bg-primary/10 hover:bg-primary/20 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
								>
									<span className="material-symbols-outlined text-primary text-lg italic">content_copy</span>
								</button>
							</div>

							<button 
								onClick={() => setView('print_config')}
								className="bg-white text-black p-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
							>
								<span className="material-symbols-outlined">print</span> Gerar Cartões Mesa
							</button>
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-8 animate-in slide-in-from-right-8 duration-500">
						<div>
							<h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Cartões de Mesa</h3>
							<p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Configure o material para impressão</p>
						</div>

						<div className="grid grid-cols-1 gap-6">
							<div className="flex flex-col gap-2">
								<label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Mensagem para os Convidados</label>
								<textarea 
									value={printConfig.message}
									onChange={e => setPrintConfig({...printConfig, message: e.target.value})}
									className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-sm outline-none focus:border-primary transition-all h-28 resize-none"
									placeholder="Ex: Escaneie e apareça no telão!"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="flex flex-col gap-2">
									<label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Quantidade (A4)</label>
									<input 
										type="number"
										value={printConfig.quantity}
										onChange={e => setPrintConfig({...printConfig, quantity: parseInt(e.target.value) || 1})}
										className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white text-lg outline-none focus:border-primary transition-all"
									/>
								</div>
								<div className="flex flex-col gap-2">
									<label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Logo do Evento</label>
									<button 
										onClick={() => setPrintConfig({...printConfig, showLogo: !printConfig.showLogo})}
										className={`h-14 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest border transition-all ${printConfig.showLogo ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-500'}`}
									>
										<span className="material-symbols-outlined text-sm">{printConfig.showLogo ? 'check_circle' : 'cancel'}</span>
										{printConfig.showLogo ? 'Ativada' : 'Desativada'}
									</button>
								</div>
							</div>
						</div>

						<div className="flex flex-col gap-3 mt-4">
							<button 
								onClick={() => setView('printable')}
								className="w-full h-16 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] italic flex items-center justify-center gap-3"
							>
								<span className="material-symbols-outlined">picture_as_pdf</span>
								Gerar Material PDF
							</button>
							<button 
								onClick={() => setView('visualizer')}
								className="w-full h-12 bg-white/5 text-slate-500 font-black rounded-xl hover:text-white transition-all uppercase text-[10px] tracking-widest"
							>
								Voltar
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
