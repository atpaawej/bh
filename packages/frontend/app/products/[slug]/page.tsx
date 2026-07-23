import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProductDetail } from "../../../components/ProductDetail";
import { ApiClientError, fetchProductBySlug } from "../../../lib/api";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** Dedupes the product fetch between generateMetadata and the page render. */
const loadProduct = cache(async (slug: string) => {
  try {
    return await fetchProductBySlug(slug);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) {
      return null;
    }
    throw err;
  }
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);

  if (!product) {
    return {
      title: "Product not found — BharatHunt",
      description: "This product does not exist or is no longer available.",
    };
  }

  const title = `${product.name} — BharatHunt`;
  const description = product.tagline || product.description.slice(0, 160);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: product.heroImageUrl
        ? [{ url: product.heroImageUrl, alt: product.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.heroImageUrl ? [product.heroImageUrl] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await loadProduct(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetail key={product.id} initialProduct={product} />;
}
