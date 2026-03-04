import { Navbar } from '@/widgets/navbar';

export function TodoPage() {
	return (
		<section className='flex min-h-screen flex-col bg-background'>
			<Navbar />
			<main className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full flex-1'>
				<h1 className='text-3xl font-bold tracking-tight mb-6'>Todo</h1>
				<div className='text-muted-foreground'>
					<p>No todos available. (Mock Data)</p>
				</div>
			</main>
		</section>
	);
}
