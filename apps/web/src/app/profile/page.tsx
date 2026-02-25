import { ProfilePage } from '@/pages-flat/profile';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Profile() {
	const cookieStore = await cookies();
	const session = cookieStore.get('blockora-session');

	if (!session) redirect('/login');

	return (
		<ProfilePage initialName='Demo User' initialEmail='skaylet2007@gmail.com' />
	);
}
