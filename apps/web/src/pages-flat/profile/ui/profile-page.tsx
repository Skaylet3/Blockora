import { ProfileForm } from '@/features/update-profile';
import { ProfileNavbar } from '@/widgets/navbar';

interface ProfilePageProps {
	initialEmail: string;
	initialUserId: string;
	initialDisplayName: string;
}

export function ProfilePage({ initialEmail, initialUserId, initialDisplayName }: ProfilePageProps) {
	return (
		<div className='flex min-h-screen flex-col bg-zinc-50'>
			<ProfileNavbar />
			<ProfileForm
				initialEmail={initialEmail}
				initialUserId={initialUserId}
				initialDisplayName={initialDisplayName}
			/>
		</div>
	);
}
