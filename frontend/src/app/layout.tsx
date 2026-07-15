import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getContent } from "@/cocms/client";
import siteConfig from "@/cocms/site-config";

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

interface NavLink {
  label: string;
  href: string;
}

interface FooterLink {
  label: string;
  href: string;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read site config for dynamic nav and footer
  let site = {
    siteName: "CoCMS",
    navLinks: [] as NavLink[],
    footerText: "",
    footerLinks: [] as FooterLink[],
  };

  try {
    const config = await getContent(siteConfig);
    site = {
      siteName: (config.siteName as string) || "CoCMS",
      navLinks: (config.navLinks as NavLink[]) || [],
      footerText: (config.footerText as string) || "",
      footerLinks: (config.footerLinks as FooterLink[]) || [],
    };
  } catch {
    // Use schema defaults if DB is unavailable
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-slate-900">
        {/* ── Dynamic Navbar ── */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-8">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-slate-900"
            >
              <span className="text-indigo-600">Co</span>
              {site.siteName.replace(/^Co/, "")}
            </Link>

            <div className="flex items-center gap-x-1">
              {site.navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  {link.label}
                </Link>
              ))}
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

        {/* ── Dynamic Footer ── */}
        <footer className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              {/* Footer text */}
              <p className="text-sm text-slate-400">{site.footerText}</p>

              {/* Footer links */}
              {site.footerLinks.length > 0 && (
                <div className="flex items-center gap-x-6">
                  {site.footerLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-400 transition-colors hover:text-slate-600"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
