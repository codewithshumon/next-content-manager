import { notFound } from "next/navigation";
import { getContent } from "@/cocms/client";
import type { PageSchema } from "@/cocms/types";

// Map each service slug to its schema loader.
const schemaLoaders: Record<
  string,
  () => Promise<{ default: PageSchema }>
> = {
  "web-development": () => import("@/cocms/service-web-dev"),
  "ui-ux-design": () => import("@/cocms/service-ui-ux"),
  "api-development": () => import("@/cocms/service-api-dev"),
  "cloud-infrastructure": () => import("@/cocms/service-cloud-infra"),
  "consulting-audits": () => import("@/cocms/service-consulting"),
  "maintenance-support": () => import("@/cocms/service-maintenance"),
};

const heroGradients: Record<string, string> = {
  "web-development": "from-slate-900 via-indigo-950 to-slate-900",
  "ui-ux-design": "from-pink-900 via-rose-900 to-slate-900",
  "api-development": "from-amber-900 via-orange-900 to-slate-900",
  "cloud-infrastructure": "from-cyan-900 via-sky-900 to-slate-900",
  "consulting-audits": "from-emerald-900 via-teal-900 to-slate-900",
  "maintenance-support": "from-violet-900 via-purple-900 to-slate-900",
};

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const loader = schemaLoaders[slug];
  if (!loader) notFound();

  const schema = (await loader()).default;
  const c = await getContent(schema);
  const gradient = heroGradients[slug] || "from-slate-900 via-indigo-950 to-slate-900";

  return (
    <main className="flex-1 bg-white">
      {/* Hero */}
      <section
        className={`relative overflow-hidden bg-linear-to-br ${gradient} py-24 sm:py-32`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 text-center lg:px-8">
          <span className="text-5xl">{c.icon as string}</span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {c.title as string}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
            {c.subtitle as string}
          </p>
        </div>
      </section>

      {/* Image + Description */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <img
            src={c.heroImage as string}
            alt={c.title as string}
            className="rounded-2xl shadow-lg"
          />
          <p className="text-lg leading-8 text-slate-600">
            {c.description as string}
          </p>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
              >
                <p className="text-lg font-semibold text-slate-900">
                  {c[`feature${n}Title`] as string}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {c[`feature${n}Desc`] as string}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
