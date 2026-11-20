import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resort Reservations — Portfolio Demo",
  description: "Interactive browser-local room reservation portfolio demo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
