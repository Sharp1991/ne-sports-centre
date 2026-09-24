type BreadcrumbItem = {
  name: string;
  href: string;
};

export default function BreadcrumbJsonLd({
  items,
}: {
  items: BreadcrumbItem[];
}) {
  const baseUrl = "https://ne-sports-centre.vercel.app";

  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
