import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabaseService } from '../services/supabaseService';
import { Evento, Midia } from '../types';
import { getOptimizedImageUrl } from '../utils/imageUtils';

interface DashboardSlideshowProps {
	event: Evento;
}

export const DashboardSlideshow: React.FC<DashboardSlideshowProps> = ({ event }) => {
	const [currentIndex, setCurrentIndex] = useState(0);

	// Busca de mídias para o slideshow usando TanStack Query
	const { data: media = [] } = useQuery({
		queryKey: ['slideshow', event.id],
		queryFn: async () => {
			const result = await supabaseService.getMediaByEvent(event.id, true);
			return result.filter(m => m.tipo === 'foto').slice(0, 10);
		},
		staleTime: 1000 * 60 * 10, // Slideshow pode ser mais "stale"
	});

	useEffect(() => {
		if (media.length <= 1) return;

		const interval = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % media.length);
		}, 5000);

		return () => clearInterval(interval);
	}, [media.length]);

	const currentPhoto = media.length > 0 ? media[currentIndex] : null;

	return (
		<div className="absolute inset-0 bg-black">
			{currentPhoto ? (
				<img
					src={getOptimizedImageUrl(currentPhoto.url, { width: 500, quality: 70 })}
					className="w-full h-full object-cover opacity-50 transition-opacity duration-1000"
					key={currentPhoto.id}
					alt="Slideshow"
				/>
			) : (
				<img
					src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800"
					className="w-full h-full object-cover opacity-50"
					alt="Default"
				/>
			)}
		</div>
	);
};
