import type { Metadata } from "next";

export const metadata: Metadata = { title: "Informes diarios" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
