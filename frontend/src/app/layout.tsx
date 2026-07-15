import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CoCMS — Co-located CMS Demo",
  description:
    "A demo website powered by CoCMS — a co-located content-editing layer for Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-slate-900">
        {/* ── Navbar ── */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-8">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-slate-900"
            >
              <span className="text-indigo-600">Co</span>CMS
            </Link>

            <div className="flex items-center gap-x-1">
              <Link
                href="/"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Home
              </Link>
              <Link
                href="/about"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                About
              </Link>
              <Link
                href="/admin"
                className="ml-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                Admin
              </Link>
            </div>
          </nav>
        </header>

        {children}

        {/* ── Footer ── */}
        <footer className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-8 text-center text-sm text-slate-400 lg:px-8">
            Powered by <span className="font-semibold text-slate-500">CoCMS</span> — the
            co-located CMS for Next.js
          </div>
        </footer>
      </body>
    </html>
  );
}
