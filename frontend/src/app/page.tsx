import { getContent } from "@/cocms/client";
import schema from "@/cocms/home-page";

export default async function HomePage() {
  const content = await getContent(schema);

  return (
    <main className="flex-1">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900">
        {/* Background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:flex lg:items-center lg:gap-x-16 lg:px-8 lg:py-40">
          {/* Text content */}
          <div className="max-w-2xl lg:shrink-0">
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              {content.heroTitle}
            </h1>
            <p className="mt-6 text-lg leading-8 text-indigo-100 sm:text-xl">
              {content.heroSubtitle}
            </p>
            <p className="mt-4 text-base leading-7 text-indigo-200/80">
              {content.tagline}
            </p>
            <div className="mt-8 flex items-center gap-x-4">
              <a
                href="/about"
                className="rounded-xl bg-indigo-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-400 hover:shadow-indigo-400/40"
              >
                {content.ctaText}
              </a>
              <a
                href="/about"
                className="rounded-xl border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Hero image */}
          <div className="mt-16 lg:mt-0 lg:flex-1">
            <div className="flex justify-center">
              <img
                src={content.heroImage}
                alt="Hero illustration"
                className="h-64 w-64 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-sm lg:h-80 lg:w-80"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="relative -mt-1 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {/* Stat 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-md">
              <p className="text-4xl font-bold text-indigo-600">
                {content.statOneValue}
              </p>
              <p className="mt-2 text-sm font-medium uppercase tracking-wider text-slate-500">
                {content.statOneLabel}
              </p>
            </div>
            {/* Stat 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-md">
              <p className="text-4xl font-bold text-indigo-600">
                {content.statTwoValue}
              </p>
              <p className="mt-2 text-sm font-medium uppercase tracking-wider text-slate-500">
                {content.statTwoLabel}
              </p>
            </div>
            {/* Stat 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-md">
              <p className="text-4xl font-bold text-indigo-600">
                {content.statThreeValue}
              </p>
              <p className="mt-2 text-sm font-medium uppercase tracking-wider text-slate-500">
                {content.statThreeLabel}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Section (image left, content right) ── */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left: image */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-2xl bg-linear-to-br from-indigo-400/20 to-purple-400/20 blur-xl" />
              <img
                src={content.featureImage}
                alt="Feature illustration"
                className="relative w-full rounded-2xl border border-slate-200 shadow-lg"
              />
            </div>

            {/* Right: content */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {content.featureTitle}
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                {content.featureDescription}
              </p>
              <div className="mt-8">
                <a
                  href="/services"
                  className="inline-flex rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500"
                >
                  {content.featureCtaText}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
