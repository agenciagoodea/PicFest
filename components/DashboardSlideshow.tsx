import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { Evento, Midia } from '../types';

interface DashboardSlideshowProps {
	event: Evento;
}

export const DashboardSlideshow: React.FC<DashboardSlideshowProps> = ({ event }) => {
	const [media, setMedia] = useState<Midia[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);

	useEffect(() => {
		loadMedia();
	}, [event.id]);

	useEffect(() => {
		if (media.length <= 1) return;

		const interval = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % media.length);
		}, 5000);

		return () => clearInterval(interval);
	}, [media.length]);

	const loadMedia = async () => {
		try {
			const result = await supabaseService.getMediaByEvent(event.id, true);
			const photos = result.filter(m => m.tipo === 'foto').slice(0, 10);
			if (photos.length > 0) {
				setMedia(photos);
			}
		} catch (error) {
			console.error('Erro ao carregar slideshow:', error);
		}
	};

	const currentPhoto = media.length > 0 ? media[currentIndex] : null;

	return (
		<div className="absolute inset-0 bg-black">
			{currentPhoto ? (
				<img
					src={currentPhoto.url}
					className="w-full h-full object-cover opacity-50 transition-opacity duration-1000"
					alt="Slideshow"
				/>
			) : (
				<img
					src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30"
					className="w-full h-full object-cover opacity-50"
					alt="Default"
				/>
			)}
		</div>
	);
};
