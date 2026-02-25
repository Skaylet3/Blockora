"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SquareDashed } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    toast.success("Signed in. Welcome back!");
    // Demo: any credentials work — set a mock session cookie
    document.cookie = "blockora-session=1; path=/; max-age=86400";
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2.5">
            <SquareDashed className="h-6 w-6 text-foreground" strokeWidth={2} />
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              Blockora
            </span>
          </div>
          <p className="text-center text-sm text-amber-600">
            Structure your thoughts. Control your knowledge.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Demo: Use any email and password to sign in
          </p>
        </form>
      </div>
    </div>
  );
}
