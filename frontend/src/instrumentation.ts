/**
 * Next.js instrumentation hook — runs once on server start.
 * Syncs all CoCMS schema files to the database.
 */
export async function register() {
  // Only run on server startup, not during build
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { syncSchemas } = await import("@/cocms/sync");

    // Import all schema files
    const homeSchema = (await import("@/cocms/home-page")).default;
    const aboutSchema = (await import("@/cocms/about-page")).default;

    await syncSchemas([homeSchema, aboutSchema]);
  }
}
