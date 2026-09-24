import Link from "next/link";

type BreadcrumbItem = {
  name: string;
  href?: string;
};

export default function Breadcrumbs({
  items,
}: {
  items: BreadcrumbItem[];
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mx-auto max-w-7xl px-5 py-4"
    >
      <ol className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">/</span>}

            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-sky-600"
              >
                {item.name}
              </Link>
            ) : (
              <span className="text-slate-600">{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
