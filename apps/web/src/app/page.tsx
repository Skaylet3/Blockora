import { DashboardPage } from '@/pages-flat/dashboard';
import { getMockBlocks } from '@/shared/lib/mock-data';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home() {
	const cookieStore = await cookies();
	const session = cookieStore.get('blockora-session');

	// Not logged in — send to login page
	if (!session) redirect('/login');

	// SSR: fetch blocks on the server, pass to client for hydration
	const blocks = await getMockBlocks();

	return <DashboardPage blocks={blocks} />;
}
