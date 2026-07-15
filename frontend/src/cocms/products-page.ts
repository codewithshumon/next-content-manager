import { array } from "./fields";

export default {
  pagePath: "/products",

  title: "Our Products",
  subtitle: "Crafted with care, built to last. Explore our collection of premium tools and gadgets.",

  products: array([
    {
      name: "Precision Widget",
      description: "A finely machined widget for precision tasks. Built from aircraft-grade aluminum.",
      price: 99,
      image: "/window.svg",
    },
    {
      name: "Smart Gadget Pro",
      description: "The next generation of smart gadgets. Connects to all your devices seamlessly.",
      price: 149,
      image: "/globe.svg",
    },
    {
      name: "Eco Charge Hub",
      description: "Sustainable charging for all your devices. Made from recycled materials.",
      price: 79,
      image: "/vercel.svg",
    },
    {
      name: "Cloud Sync Module",
      description: "Keep your data in sync across all platforms with enterprise-grade security.",
      price: 199,
      image: "/next.svg",
    },
  ]),
};
