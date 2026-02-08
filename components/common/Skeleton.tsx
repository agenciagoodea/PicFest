
import React from 'react';

interface SkeletonProps {
	className?: string;
	variant?: 'rect' | 'circle' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rect' }) => {
	const baseClasses = 'bg-white/5 animate-pulse';
	const variantClasses = {
		rect: 'rounded-2xl',
		circle: 'rounded-full',
		text: 'rounded-lg h-4 w-full',
	};

	return (
		<div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
	);
};

export const DashboardSkeleton = () => (
	<div className="flex flex-col gap-10 animate-in fade-in duration-500">
		<header className="flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-0">
			<div className="text-center sm:text-left w-full sm:w-auto">
				<Skeleton className="h-10 w-48 mb-2" />
				<Skeleton className="h-4 w-64" />
			</div>
			<Skeleton className="h-14 w-40 rounded-2xl" />
		</header>

		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
			{[1, 2, 3, 4].map(i => (
				<Skeleton key={i} className="h-32 w-full rounded-3xl" />
			))}
		</div>

		<section className="mt-4">
			<div className="flex justify-between items-center mb-6">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-4 w-20" />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				{[1, 2, 3].map(i => (
					<Skeleton key={i} className="aspect-square rounded-[2.5rem]" />
				))}
			</div>
		</section>
	</div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
	<div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
		<div className="p-8 flex flex-col gap-6">
			{[...Array(rows)].map((_, i) => (
				<div key={i} className="flex items-center gap-4">
					<Skeleton className="w-12 h-12 rounded-xl" />
					<div className="flex-1 flex flex-col gap-2">
						<Skeleton className="h-4 w-1/3" />
						<Skeleton className="h-3 w-1/4" />
					</div>
					<Skeleton className="h-8 w-20 rounded-lg" />
				</div>
			))}
		</div>
	</div>
);
