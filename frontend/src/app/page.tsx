"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "../lib/auth";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getAuth();
    if (!user) {
      router.push("/login");
    } else {
      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/client");
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Initialisation de l'entrepôt intelligent...</p>
      </div>
    </div>
  );
}
