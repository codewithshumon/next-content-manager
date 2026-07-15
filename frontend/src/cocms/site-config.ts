import { array } from "./fields";

/**
 * Global site configuration — drives the dynamic header nav, footer links,
 * and other site-wide content. Uses the special pagePath "/__site" so it
 * appears as "Site Settings" in the admin panel.
 */
export default {
  pagePath: "/__site",

  siteName: "CoCMS",

  navLinks: array([
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Products", href: "/products" },
    { label: "Services", href: "/services" },
  ]),

  footerText: "Powered by CoCMS — the co-located CMS for Next.js.",

  footerLinks: array([
    { label: "GitHub", href: "https://github.com" },
    { label: "Twitter", href: "https://twitter.com" },
    { label: "LinkedIn", href: "https://linkedin.com" },
  ]),
};
