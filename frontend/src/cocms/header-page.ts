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
};
