import { array } from "./fields";

/**
 * Site footer — drives the dynamic footer bar.
 * Editable from the admin panel as a regular page.
 */
export default {
  pagePath: "/__footer",

  footerText: "Powered by CoCMS — the co-located CMS for Next.js.",

  footerLinks: array([
    { label: "GitHub", href: "https://github.com" },
    { label: "Twitter", href: "https://twitter.com" },
    { label: "LinkedIn", href: "https://linkedin.com" },
  ]),
};
