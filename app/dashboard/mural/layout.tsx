import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mural" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
