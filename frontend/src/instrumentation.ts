/**
 * Next.js instrumentation hook — runs once on server start.
 * Syncs all CoCMS schema files to the database.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { syncSchemas } = await import("@/cocms/sync");

    const homeSchema = (await import("@/cocms/home-page")).default;
    const aboutSchema = (await import("@/cocms/about-page")).default;
    const headerSchema = (await import("@/cocms/header-page")).default;
    const footerSchema = (await import("@/cocms/footer-page")).default;
    const productsSchema = (await import("@/cocms/products-page")).default;
    const servicesSchema = (await import("@/cocms/services-page")).default;

    const webDev = (await import("@/cocms/service-web-dev")).default;
    const uiUx = (await import("@/cocms/service-ui-ux")).default;
    const apiDev = (await import("@/cocms/service-api-dev")).default;
    const cloudInfra = (await import("@/cocms/service-cloud-infra")).default;
    const consulting = (await import("@/cocms/service-consulting")).default;
    const maintenance = (await import("@/cocms/service-maintenance")).default;

    await syncSchemas([
      homeSchema,
      aboutSchema,
      headerSchema,
      footerSchema,
      productsSchema,
      servicesSchema,
      webDev,
      uiUx,
      apiDev,
      cloudInfra,
      consulting,
      maintenance,
    ]);
  }
}
