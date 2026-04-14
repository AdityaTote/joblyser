"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "../../components/Sidebar";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LogOut,
  User as UserIcon,
  Moon,
  Sun,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { useTheme } from "@/components/theme-provider";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleSignOut = () => {
    setUser(null);
    router.push("/");
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-[16px] font-medium">Workspace</h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-[8px] border border-border bg-surface2 text-text2 hover:bg-surface3 h-8 w-8"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            <div className="w-px h-4 bg-border mx-2" />
            <Link
              href="/user/profile"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "btn-ghost h-8 px-3")}
            >
              <UserIcon className="w-4 h-4 mr-2" />
              Profile
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="btn-ghost h-8 px-3 text-text3 hover:text-red"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-surface2/30">
          {children}
        </div>
      </main>
    </div>
  );
}
