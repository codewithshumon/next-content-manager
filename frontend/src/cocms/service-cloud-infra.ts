import { image } from "./fields";

export default {
  pagePath: "/services/cloud-infrastructure",

  title: "Cloud Infrastructure",
  subtitle: "Deploy, scale, and monitor your applications with confidence.",
  icon: "☁️",
  heroImage: image("https://picsum.photos/seed/cloudinfra/1200/600"),

  description:
    "From Docker containers to Kubernetes clusters, we handle the infrastructure so you can focus on building features. Automated CI/CD pipelines, zero-downtime deployments, and 24/7 monitoring keep your services running smoothly.",

  feature1Title: "Containerization",
  feature1Desc: "Docker and Kubernetes setups for consistent, reproducible deployments across environments.",

  feature2Title: "CI/CD Pipelines",
  feature2Desc: "Automated testing, building, and deployment workflows that ship code on every push.",

  feature3Title: "Monitoring & Alerts",
  feature3Desc: "Real-time dashboards, log aggregation, and intelligent alerting for proactive issue detection.",
};
