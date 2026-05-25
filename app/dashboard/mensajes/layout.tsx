import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mensajes" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
