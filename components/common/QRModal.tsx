import React from 'react';
import { Evento } from '../../types';

interface QRModalProps {
	event: Evento;
	onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({ event, onClose }) => {
	return (
		<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
			<div className="bg-slate-900 border border-white/10 p-10 rounded-[3rem] max-w-sm w-full relative shadow-2xl scale-in-center">
				<button
					onClick={onClose}
					className="absolute top-6 right-6 w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
				>
					<span className="material-symbols-outlined">close</span>
				</button>

				<div className="text-center">
					<div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
						<span className="material-symbols-outlined !text-3xl">qr_code_2</span>
					</div>

					<h3 className="text-2xl font-black text-white mb-1 uppercase italic tracking-tighter">{event.nome}</h3>
					<p className="text-slate-500 text-sm mb-8 font-bold uppercase tracking-widest">Escaneie para Capturar</p>

					<div className="bg-white p-6 rounded-[2.5rem] shadow-inner mb-8 mx-auto w-fit">
						<img
							src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/#/evento/' + event.slug_curto)}&color=000000&bgcolor=ffffff`}
							className="w-48 h-48"
							alt="QR Code"
						/>
					</div>

					<div className="bg-white/5 p-4 rounded-2xl flex items-center justify-between gap-3 border border-white/5">
						<div className="text-left overflow-hidden">
							<p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Link do Evento</p>
							<p className="text-xs text-primary font-bold truncate">picfest.com.br/evento/{event.slug_curto}</p>
						</div>
						<button
							onClick={() => {
								navigator.clipboard.writeText(`${window.location.origin}/#/evento/${event.slug_curto}`);
								alert('Link copiado com sucesso!');
							}}
							className="w-10 h-10 bg-primary/10 hover:bg-primary/20 rounded-xl flex items-center justify-center transition-colors"
						>
							<span className="material-symbols-outlined text-primary text-xl">content_copy</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
