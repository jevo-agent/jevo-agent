import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jev · JEVO",
  description: "Jev is the dedicated decision engine powering the JEVO autonomous stock-to-meme discovery protocol.",
};

export default function JevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
