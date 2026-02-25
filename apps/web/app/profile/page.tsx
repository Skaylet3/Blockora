import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileNavbar } from "@/components/profile-navbar";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("blockora-session");

  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <ProfileNavbar />
      <ProfileForm
        initialName="Demo User"
        initialEmail="skaylet2007@gmail.com"
      />
    </div>
  );
}
