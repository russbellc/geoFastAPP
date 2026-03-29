"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/auth";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import OnboardingOverlay from "@/components/onboarding/OnboardingOverlay";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, checkAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-on-primary-fixed" style={{ fontVariationSettings: '"FILL" 1' }}>
              explore
            </span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">Loading GeoIntel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <OnboardingOverlay />
    </div>
  );
}
