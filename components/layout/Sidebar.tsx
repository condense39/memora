"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  User,
  Heart,
  Bell,
  LogOut,
  ChevronDown,
  X,
  Sparkles,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import type { UserRole } from "@/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/my-photos", label: "My Photos", icon: User },
  { href: "/favourites", label: "Favourites", icon: Heart },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const roleBadgeColor: Record<UserRole, string> = {
  admin: "bg-purple-100 text-purple-700",
  user: "bg-gray-100 text-gray-600",
};

interface SidebarProps {
  onUploadClick?: () => void;
}

export default function Sidebar({ onUploadClick }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const user = session?.user;
  const role = (user?.role ?? "user") as UserRole;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <aside className="w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-100 flex flex-col overflow-y-auto">
      {/* User Info */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? "User"}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-yellow-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-semibold text-sm ring-2 ring-yellow-200">
                {getInitials(user?.name ?? "U")}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {user?.name ?? "User"}
            </p>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                roleBadgeColor[role]
              )}
            >
              {role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-l-lg rounded-r-sm text-sm transition-all duration-150 group",
                isActive
                  ? "bg-yellow-50 text-yellow-700 border-r-2 border-yellow-400 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon
                size={18}
                className={cn(
                  "transition-colors",
                  isActive ? "text-yellow-500" : "text-gray-400 group-hover:text-gray-600"
                )}
              />
              {label}
              {label === "Notifications" && (
                <span className="ml-auto bg-yellow-400 text-gray-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  0
                </span>
              )}
            </Link>
          );
        })}

      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 px-3 py-2 mb-1">
          <Sparkles size={14} className="text-yellow-400" />
          <span className="text-xs text-gray-400">Memora v1.0</span>
        </div>
        <button
          id="sidebar-signout-btn"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group disabled:opacity-60"
        >
          <LogOut
            size={18}
            className="text-gray-400 group-hover:text-red-500 transition-colors"
          />
          {isSigningOut ? "Signing out…" : "Sign Out"}
        </button>
      </div>
    </aside>
  );
}
