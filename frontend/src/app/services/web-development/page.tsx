import { getContent } from "@/cocms/client";
import schema from "@/cocms/service-web-dev";

export default async function WebDevPage() {
  const c = await getContent(schema);

  return (
    <main className="flex-1 bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 py-24 sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 text-center lg:px-8">
          <span className="text-5xl">{c.icon as string}</span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">{c.title as string}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-indigo-100">{c.subtitle as string}</p>
        </div>
      </section>

      {/* Image + Description */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <img src={c.heroImage as string} alt={c.title as string} className="rounded-2xl shadow-lg" />
          <div>
            <p className="text-lg leading-8 text-slate-600">{c.description as string}</p>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            {[c.feature1Title, c.feature2Title, c.feature3Title].map((title, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-lg font-semibold text-slate-900">{title as string}</p>
                <p className="mt-3 text-sm leading-6 text-slate-500">{[c.feature1Desc, c.feature2Desc, c.feature3Desc][i] as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
