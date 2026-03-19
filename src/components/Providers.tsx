"use client";

import { SeasonProvider } from "@/lib/season-context";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return <SeasonProvider>{children}</SeasonProvider>;
}
