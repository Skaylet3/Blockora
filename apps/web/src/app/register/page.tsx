import { RegisterPage } from '@/pages-flat/register';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Register() {
	const cookieStore = await cookies();
	const session = cookieStore.get('blockora-session');

	// Already logged in — send to dashboard
	if (session) redirect('/');

	return <RegisterPage />;
}
