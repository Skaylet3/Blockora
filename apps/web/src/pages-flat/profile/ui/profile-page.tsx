import { ProfileForm } from '@/features/update-profile';
import { ProfileNavbar } from '@/widgets/navbar';

interface ProfilePageProps {
	initialName: string;
	initialEmail: string;
}

export function ProfilePage({ initialName, initialEmail }: ProfilePageProps) {
	return (
		<div className='flex min-h-screen flex-col bg-zinc-50'>
			<ProfileNavbar />
			<ProfileForm initialName={initialName} initialEmail={initialEmail} />
		</div>
	);
}
