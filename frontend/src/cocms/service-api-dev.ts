import { image } from "./fields";

export default {
  pagePath: "/services/api-development",

  title: "API Development",
  subtitle: "Robust, secure, and scalable APIs that power your applications.",
  icon: "⚡",
  heroImage: image("https://picsum.photos/seed/apidev/1200/600"),

  description:
    "Whether you need a RESTful API, GraphQL endpoint, or real-time WebSocket server, we design and build backend systems that handle millions of requests. Authentication, rate limiting, caching, and monitoring are all built in from day one.",

  feature1Title: "REST & GraphQL",
  feature1Desc: "Clean, well-documented endpoints that follow industry best practices and standards.",

  feature2Title: "Authentication & Security",
  feature2Desc: "JWT, OAuth2, API keys — with proper encryption, input validation, and rate limiting.",

  feature3Title: "Performance at Scale",
  feature3Desc: "Database indexing, query optimization, caching layers, and load-balanced deployments.",
};
