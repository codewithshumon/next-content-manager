import { getContent } from "@/cocms/client";
import schema from "@/cocms/products-page";

export default async function ProductsPage() {
  const content = await getContent(schema);
  const products = content.products as Array<{
    name: string;
    description: string;
    price: number;
    image: string;
  }>;

  return (
    <main className="flex-1 bg-white">
      {/* ── Header ── */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {content.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-indigo-100">
            {content.subtitle}
          </p>
        </div>
      </section>

      {/* ── Product Grid ── */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        {!products || products.length === 0 ? (
          <p className="text-center text-slate-400">
            No products yet. Add some from the admin panel.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, idx) => (
              <div
                key={idx}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
              >
                {/* Product image */}
                <div className="flex h-48 items-center justify-center bg-slate-50 p-6">
                  <img
                    src={product.image || "/globe.svg"}
                    alt={product.name}
                    className="h-28 w-28 object-contain transition-transform group-hover:scale-110"
                  />
                </div>

                {/* Product info */}
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {product.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
                    {product.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-bold text-indigo-600">
                      ${product.price}
                    </span>
                    <button className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
