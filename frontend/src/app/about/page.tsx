import { getContent } from "@/cocms/client";
import schema from "@/cocms/about-page";

export default async function AboutPage() {
  const content = await getContent(schema);

  return (
    <main className="flex-1 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        {/* ── Profile Section ── */}
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Image */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-indigo-400 to-purple-500 opacity-20 blur-2xl" />
              <img
                src={content.profileImage}
                alt="Profile photo"
                className="relative h-72 w-72 rounded-3xl border border-slate-200 bg-slate-100 object-cover p-4 shadow-xl lg:h-96 lg:w-96"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {content.title}
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              {content.bio}
            </p>

            {/* Info cards */}
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
                <p className="text-sm font-medium uppercase tracking-wider text-indigo-500">
                  Experience
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {content.yearsOfExperience}+ years
                </p>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
                <p className="text-sm font-medium uppercase tracking-wider text-indigo-500">
                  Location
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {content.location}
                </p>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 sm:col-span-2">
                <p className="text-sm font-medium uppercase tracking-wider text-indigo-500">
                  Skills
                </p>
                <p className="mt-1 text-base font-semibold leading-relaxed text-slate-800">
                  {content.skills}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
