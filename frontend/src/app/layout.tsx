import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import Link from "next/link";
import "./globals.css";
import { getContent } from "@/cocms/client";
import headerSchema from "@/cocms/header-page";
import footerSchema from "@/cocms/footer-page";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CoCMS Demo",
  description:
    "A demo website powered by CoCMS — a content-editing layer for Next.js.",
};

interface NavLink {
  label: string;
  href: string;
}

interface FooterLink {
  label: string;
  href: string;
}

interface ServiceLink {
  label: string;
  href: string;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const pathname = h.get("x-pathname") || "";
  const isAdmin = pathname.startsWith("/admin");

  // Read header & footer from their own pages (skip on admin)
  let headerData = {
    siteName: "CoCMS",
    navLinks: [] as NavLink[],
    serviceLinks: [] as ServiceLink[],
  };
  let footerData = {
    footerText: "",
    footerLinks: [] as FooterLink[],
  };

  if (!isAdmin) {
    try {
      const header = await getContent(headerSchema);
      headerData = {
        siteName: (header.siteName as string) || "CoCMS",
        navLinks: (header.navLinks as NavLink[]) || [],
        serviceLinks: (header.serviceLinks as ServiceLink[]) || [],
      };
    } catch { /* use defaults */ }

    try {
      const footer = await getContent(footerSchema);
      footerData = {
        footerText: (footer.footerText as string) || "",
        footerLinks: (footer.footerLinks as FooterLink[]) || [],
      };
    } catch { /* use defaults */ }
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-slate-900">
        {!isAdmin && (
          <>
            {/* ── Dynamic Navbar ── */}
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
              <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-8">
                <Link
                  href="/"
                  className="text-lg font-bold tracking-tight text-slate-900"
                >
                  <span className="text-indigo-600">Co</span>
                  {headerData.siteName.replace(/^Co/, "")}
                </Link>

                <div className="flex items-center gap-x-1">
                  {headerData.navLinks.map((link) => {
                    // Services link renders as a CSS dropdown
                    if (link.label === "Services" && headerData.serviceLinks.length > 0) {
                      return (
                        <div key={link.href} className="group relative">
                          <Link
                            href={link.href}
                            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 inline-flex items-center gap-x-1"
                          >
                            {link.label}
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </Link>
                          <div className="absolute left-0 top-full z-50 hidden min-w-55 rounded-xl border border-slate-200 bg-white py-1 shadow-lg group-hover:block">
                            {headerData.serviceLinks.map((sl) => (
                              <Link
                                key={sl.href}
                                href={sl.href}
                                className="block px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                              >
                                {sl.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      >
                        {link.label}
                      </Link>
                    );
                  })}
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
                  <p className="text-sm text-slate-400">{footerData.footerText}</p>
                  {footerData.footerLinks.length > 0 && (
                    <div className="flex items-center gap-x-6">
                      {footerData.footerLinks.map((link) => (
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
          </>
        )}

        {isAdmin && children}
      </body>
    </html>
  );
}
