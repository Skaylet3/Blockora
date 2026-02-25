import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { BlocksClient } from "@/components/blocks-client";
import { getMockBlocks } from "@/lib/mock-data";

export default async function Home() {
  const cookieStore = await cookies();
  const session = cookieStore.get("blockora-session");

  // Not logged in — send to login page
  if (!session) redirect("/login");

  // SSR: fetch blocks on the server, pass to client for hydration
  const blocks = await getMockBlocks();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <BlocksClient initialBlocks={blocks} />
    </div>
  );
}
