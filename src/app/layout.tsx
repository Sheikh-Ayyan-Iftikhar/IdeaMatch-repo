import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });

export const metadata: Metadata = {
  title: "IdeaMatch: find the open-source projects behind your idea",
  description: "Describe a project idea and see which GitHub repositories already do part of it, with a score you can inspect.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen">
        <header className="border-b border-line">
          <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5 sm:px-8">
            <Link href="/" className="font-display text-lg font-semibold tracking-tight">
              Idea<span className="text-accent">Match</span>
            </Link>
            <Link href="/discover" className="text-sm text-muted hover:text-text">Find matches</Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
