import type { Block } from '@/entities/block';
import { BlocksClient } from '@/widgets/blocks-list';
import { Navbar } from '@/widgets/navbar';

interface DashboardPageProps {
	blocks: Block[];
}

export function DashboardPage({ blocks }: DashboardPageProps) {
	return (
		<section className='flex min-h-screen flex-col bg-background'>
			<Navbar />
			<BlocksClient initialBlocks={blocks} />
		</section>
	);
}
