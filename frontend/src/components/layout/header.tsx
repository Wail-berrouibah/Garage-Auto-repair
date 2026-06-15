"use client";

import { useSidebarStore } from "@/stores/sidebar-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, Bell, Search } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export function Header() {
  const { toggle } = useSidebarStore();
  const { user } = useAuthStore();

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : "M";

  return (
    <header className="flex items-center justify-between h-14 px-4 md:px-6 border-b border-border bg-white/50 backdrop-blur-xl shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search bar */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search work orders, customers..."
            className="h-9 w-64 lg:w-80 rounded-lg border border-border bg-muted/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-accent/50 focus:bg-white transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[4px] border border-border bg-white text-[10px] font-medium text-muted-foreground/60">
            <span>⌘</span>K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/80">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
        </button>
        <div className="flex items-center gap-2.5 pl-2 border-l border-border ml-1">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-foreground leading-tight">
              {user ? `${user.firstName} ${user.lastName}` : "User"}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight">Admin</p>
          </div>
          <Avatar className="h-8 w-8 ring-2 ring-border ring-offset-2 ring-offset-background">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
