import { ProfilePage } from '@/pages-flat/profile';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Profile() {
	const cookieStore = await cookies();
	const session = cookieStore.get('blockora-session');

	if (!session) redirect('/login');

	// Access token is stored in localStorage (client-only).
	// Pass empty strings so the ProfilePage/ProfileForm fetches /auth/me client-side.
	return <ProfilePage initialEmail='' initialUserId='' initialDisplayName='' />;
}
