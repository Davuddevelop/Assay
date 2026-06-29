"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refreshes the report while a scan is still queued/running. */
export function ScanPoller({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(t);
  }, [active, router]);
  return null;
}
