import { array } from "./fields";

export default {
  pagePath: "/services",

  title: "Our Services",
  subtitle: "We help businesses grow with modern, scalable solutions tailored to their needs.",

  services: array([
    {
      name: "Web Development",
      description: "Custom web applications built with Next.js, React, and TypeScript. Fast, accessible, and SEO-friendly.",
      icon: "🌐",
    },
    {
      name: "UI/UX Design",
      description: "User-centered design that converts visitors into customers. Wireframes, prototypes, and design systems.",
      icon: "🎨",
    },
    {
      name: "API Development",
      description: "Robust REST and GraphQL APIs that scale. Built with proper authentication, rate limiting, and documentation.",
      icon: "⚡",
    },
    {
      name: "Cloud Infrastructure",
      description: "Deploy and scale on AWS, Vercel, or your own servers. Docker containers, CI/CD pipelines, and monitoring.",
      icon: "☁️",
    },
    {
      name: "Consulting & Audits",
      description: "Code reviews, performance audits, and architecture consulting to level up your existing projects.",
      icon: "🔍",
    },
    {
      name: "Maintenance & Support",
      description: "Ongoing support, bug fixes, and feature development to keep your applications running smoothly.",
      icon: "🛠️",
    },
  ]),
};
