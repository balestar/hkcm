import type { Metadata } from "next";
import { HostPanel } from "@/components/HostPanel";

export const metadata: Metadata = {
  title: "Host",
  robots: { index: false, follow: false },
};

export default function HostPage() {
  return <HostPanel />;
}
