"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ProfileFormProps {
  initialName: string;
  initialEmail: string;
}

export function ProfileForm({ initialName, initialEmail }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = React.useState(initialName);
  const [email, setEmail] = React.useState(initialEmail);
  const [saved, setSaved] = React.useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success("Profile updated successfully.");
  }

  function handleCancel() {
    setName(initialName);
    setEmail(initialEmail);
    toast.info("Changes discarded.");
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">

          {/* Profile Settings */}
          <h1 className="mb-5 text-xl font-semibold text-foreground">
            Profile Settings
          </h1>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit">
                {saved ? "Saved!" : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div className="my-6 border-t border-border" />

          {/* Account Information */}
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Account Information
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">User ID</span>
              <span className="text-sm font-medium text-amber-600">1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Account Type</span>
              <span className="text-sm font-medium text-amber-600">
                Demo Account
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Member since</span>
              <span className="text-sm font-medium text-amber-600">
                Feb 2026
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
