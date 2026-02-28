import { DashboardPage } from '@/pages-flat/dashboard';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home() {
	const cookieStore = await cookies();
	const session = cookieStore.get('blockora-session');

	// Not logged in — send to login page
	if (!session) redirect('/login');

	// Blocks are fetched client-side in BlocksClient
	return <DashboardPage blocks={[]} />;
}
