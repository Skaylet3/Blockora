import Link from "next/link";
import { SquareDashed, User } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <SquareDashed className="h-5 w-5 text-foreground" strokeWidth={2} />
            <span className="text-base font-semibold tracking-tight text-foreground">
              Blockora
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              skaylet2007@gmail.com
            </span>
            <Link
              href="/profile"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Profile"
            >
              <User className="h-4 w-4" />
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
