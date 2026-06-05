"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar
          onMenuToggle={() => setIsMobileSidebarOpen((v) => !v)}
        />

        {/* Mobile sidebar overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        <div className="flex pt-16">
          {/* Sidebar */}
          <div
            className={cn(
              "fixed top-16 z-40 h-[calc(100vh-4rem)] bg-white transition-transform duration-300 ease-in-out md:sticky md:translate-x-0 md:bg-transparent",
              isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <Sidebar onUploadClick={() => setIsMobileSidebarOpen(false)} />
          </div>

          {/* Main content */}
          <main className="flex-1 min-h-[calc(100vh-4rem)] overflow-x-hidden">
            <div className="p-6 max-w-7xl mx-auto animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
