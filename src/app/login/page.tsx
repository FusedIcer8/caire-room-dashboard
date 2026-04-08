"use client";

import { useAuth } from "@/hooks/use-auth";
import { useIsAuthenticated } from "@azure/msal-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { login } = useAuth();
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] text-white">
      <h1 className="mb-2 text-3xl font-bold">Caire Room Manager</h1>
      <p className="mb-8 text-gray-400">
        Sign in with your Caire Inc account to manage conference rooms.
      </p>
      <button
        onClick={login}
        className="rounded-lg bg-indigo-600 px-8 py-3 text-lg font-semibold text-white transition hover:bg-indigo-500"
      >
        Sign in with Microsoft
      </button>
    </div>
  );
}
