import { getContent } from "@/cocms/client";
import schema from "@/cocms/services-page";

export default async function ServicesPage() {
  const content = await getContent(schema);
  const services = content.services as Array<{
    name: string;
    description: string;
    icon: string;
  }>;

  return (
    <main className="flex-1 bg-white">
      {/* ── Header ── */}
      <section className="bg-linear-to-br from-slate-50 to-indigo-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {content.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-500">
            {content.subtitle}
          </p>
        </div>
      </section>

      {/* ── Services Grid ── */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        {!services || services.length === 0 ? (
          <p className="text-center text-slate-400">
            No services yet. Add some from the admin panel.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-indigo-200"
              >
                {/* Icon */}
                <div className="mb-5 text-4xl">{service.icon || "📦"}</div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-slate-900">
                  {service.name}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {service.description}
                </p>

                {/* Learn more link */}
                <div className="mt-5">
                  <span className="text-sm font-medium text-indigo-600 transition-colors group-hover:text-indigo-500">
                    Learn more →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
