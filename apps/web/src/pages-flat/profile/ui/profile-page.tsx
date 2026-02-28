import { ProfileForm } from '@/features/update-profile';
import { ProfileNavbar } from '@/widgets/navbar';

interface ProfilePageProps {
	initialEmail: string;
	initialUserId: string;
}

export function ProfilePage({ initialEmail, initialUserId }: ProfilePageProps) {
	return (
		<div className='flex min-h-screen flex-col bg-zinc-50'>
			<ProfileNavbar />
			<ProfileForm initialEmail={initialEmail} initialUserId={initialUserId} />
		</div>
	);
}
