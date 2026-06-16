"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Car,
  Wrench,
  Package,
  ShoppingCart,
  Receipt,
  CreditCard,
  ClipboardCheck,
  BarChart3,
  Bell,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  BookOpen,
  X,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; soon?: boolean };

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/users", label: "Users", icon: UserCog },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/vehicles", label: "Vehicles", icon: Car },
  { href: "/dashboard/work-orders", label: "Work Orders", icon: Wrench },
  { href: "/dashboard/services", label: "Services", icon: BookOpen },
  { href: "/dashboard/inventory", label: "Inventory", icon: Package },
  { href: "/dashboard/purchasing", label: "Purchasing", icon: ShoppingCart },
  { href: "/dashboard/invoicing", label: "Invoicing", icon: Receipt },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard, soon: true },
  { href: "/dashboard/quality-control", label: "Quality Control", icon: ClipboardCheck },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell, soon: true },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/branches", label: "Branches", icon: Building2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle, setOpen } = useSidebarStore();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (window.innerWidth < 768) {
      setOpen(false);
    }
  }, [setOpen]);

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : "M";

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "flex flex-col bg-white text-foreground border-r border-border transition-all duration-300 ease-in-out",
          // Mobile: fixed overlay that slides in
          "fixed top-0 left-0 z-50 h-full",
          "md:static md:z-auto",
          isOpen
            ? "translate-x-0 w-56"
            : "-translate-x-full w-56",
          !isOpen && "md:translate-x-0 md:w-16",
        )}
      >
        {/* Header */}
        <div className="flex items-center h-14 px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent shrink-0">
              <span className="text-xs font-bold text-accent-foreground">M</span>
            </div>
            <span
              className={cn(
                "font-semibold text-sm transition-opacity duration-200",
                isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden md:opacity-0",
              )}
            >
              Mechanica
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden ml-auto text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = !item.soon && pathname === item.href;
            const content = (
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-all duration-200",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : item.soon
                      ? "text-muted-foreground/40 cursor-not-allowed"
                      : "text-muted-foreground",
                )}
                title={!isOpen ? item.label : undefined}
              >
                <Icon className={cn("h-5 w-5 shrink-0", item.soon && "opacity-40")} />
                <span
                  className={cn(
                    "transition-opacity duration-200 flex items-center gap-2",
                    isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden",
                  )}
                >
                  {item.label}
                  {item.soon && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground/50 uppercase tracking-wider">
                      Soon
                    </span>
                  )}
                </span>
              </div>
            );
            if (item.soon) {
              return <div key={item.href}>{content}</div>;
            }
            return (
              <Link key={item.href} href={item.href} onClick={() => window.innerWidth < 768 && setOpen(false)}>
                {content}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-border p-2 shrink-0">
          <div className={cn("flex items-center gap-3 px-3 py-2", !isOpen && "justify-center")}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "flex-1 min-w-0 transition-opacity duration-200",
                isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden",
              )}
            >
              <p className="text-sm font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            {isOpen && (
              <button
                onClick={() => logout()}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop toggle */}
        <button
          onClick={toggle}
          className="hidden md:flex items-center justify-center h-8 mx-2 mb-2 rounded-[var(--radius-sm)] text-muted-foreground hover:bg-sidebar-active transition-colors"
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </aside>
    </>
  );
}
