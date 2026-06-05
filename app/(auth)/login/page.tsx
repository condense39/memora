import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Memora account",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-yellow-50" />}>
      <LoginForm />
    </Suspense>
  );
}
