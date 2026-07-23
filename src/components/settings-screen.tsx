"use client";

import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { useTheme } from "@/context/theme-context";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function SettingsScreen() {
  const { theme, toggle } = useTheme();
  const { profile, signOut } = useAuth();

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <CardTitle>Appearance</CardTitle>
        <CardDescription className="mb-4">Choose how Sahayam looks on this device.</CardDescription>
        <div className="flex items-center justify-between rounded-xl border border-surface-border dark:border-surface-border-dark px-4 py-3">
          <div className="flex items-center gap-3">
            {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="text-sm font-medium capitalize">{theme} mode</span>
          </div>
          <Button variant="secondary" onClick={toggle}>
            Switch to {theme === "light" ? "dark" : "light"}
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Account</CardTitle>
        <CardDescription className="mb-4">{profile?.email}</CardDescription>
        <Button variant="danger" onClick={signOut}>
          Sign out
        </Button>
      </Card>
    </div>
  );
}
