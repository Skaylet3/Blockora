import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("blockora-session");

  // Already logged in — send to dashboard
  if (session) redirect("/");

  return <LoginForm />;
}
