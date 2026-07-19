import { array } from "./fields";

/**
 * Site header — drives the dynamic navigation bar.
 * Editable from the admin panel as a regular page.
 */
export default {
  pagePath: "/__header",

  siteName: "CoCMS",

  navLinks: array([
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Products", href: "/products" },
    { label: "Services", href: "/services" },
  ]),

  serviceLinks: array([
    { label: "Web Development", href: "/services/web-development" },
    { label: "UI/UX Design", href: "/services/ui-ux-design" },
    { label: "API Development", href: "/services/api-development" },
    { label: "Cloud Infrastructure", href: "/services/cloud-infrastructure" },
    { label: "Consulting & Audits", href: "/services/consulting-audits" },
    { label: "Maintenance & Support", href: "/services/maintenance-support" },
  ]),
};
