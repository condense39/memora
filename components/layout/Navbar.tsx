"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import NotificationBell from "@/components/layout/NotificationBell";
import SearchBar from "@/components/search/SearchBar";
import { Suspense } from "react";

interface NavbarProps {
  onMenuToggle?: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const user = session?.user;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setIsDropdownOpen(false);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b-2 border-yellow-400 z-50 flex items-center px-4 gap-4">
      {/* Mobile menu toggle */}
      <button
        id="navbar-menu-toggle"
        className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
        <span className="text-2xl font-bold tracking-tight">
          <span className="text-yellow-400">M</span>
          <span className="text-gray-900">emora</span>
        </span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <Suspense fallback={<div className="w-10 sm:w-64" />}>
        <SearchBar />
      </Suspense>

      {/* Notifications */}
      <NotificationBell />

      {/* User Avatar Dropdown */}
      <div className="relative">
        <button
          id="navbar-user-menu"
          onClick={() => setIsDropdownOpen((v) => !v)}
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name ?? "User"}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-yellow-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-semibold text-xs ring-2 ring-yellow-200">
              {getInitials(user?.name ?? "U")}
            </div>
          )}
          <ChevronDown
            size={14}
            className={cn(
              "text-gray-400 transition-transform duration-200",
              isDropdownOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-20 animate-scale-in">
              <div className="px-4 py-2 border-b border-gray-100 mb-1">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>

              <Link
                href="/profile"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <User size={16} className="text-gray-400" />
                Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Settings size={16} className="text-gray-400" />
                Settings
              </Link>

              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  id="navbar-signout-btn"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  <LogOut size={16} />
                  {isSigningOut ? "Signing out…" : "Sign Out"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
