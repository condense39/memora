import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your Memora account and start organizing your memories",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
