'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CategoryResponse, ProductResponse } from '@bh/shared'
import { ApiClientError, fetchCategories, fetchProducts } from '../lib/api'
import { CategoryChips } from './CategoryChips'
import { ProductCard, ProductCardSkeleton } from './ProductCard'

export function ProductFeed() {
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const loadingMoreRef = useRef(false)
  const categoriesLoadedRef = useRef(false)

  // Load categories once (chips are independent of the product page)
  useEffect(() => {
    if (categoriesLoadedRef.current) return
    categoriesLoadedRef.current = true
    void fetchCategories()
      .then(setCategories)
      .catch(() => {
        // Chips are optional; product feed error state covers hard failures
      })
  }, [])

  const loadInitial = useCallback(async (category: string | null) => {
    setInitialLoading(true)
    setError(null)
    setProducts([])
    setNextCursor(null)
    setHasMore(false)

    try {
      const page = await fetchProducts({ category })
      setProducts(page.data)
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'Something went wrong loading products'
      setError(message)
    } finally {
      setInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadInitial(selectedCategory)
  }, [selectedCategory, reloadKey, loadInitial])

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingMoreRef.current || initialLoading || error) return

    loadingMoreRef.current = true
    setLoadingMore(true)
    try {
      const page = await fetchProducts({
        cursor: nextCursor,
        category: selectedCategory,
      })
      setProducts((prev) => {
        const seen = new Set(prev.map((p) => p.id))
        const fresh = page.data.filter((p) => !seen.has(p.id))
        return [...prev, ...fresh]
      })
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'Failed to load more products'
      setError(message)
    } finally {
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }, [hasMore, nextCursor, selectedCategory, initialLoading, error])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loadMore, products.length])

  function handleRetry() {
    setReloadKey((k) => k + 1)
  }

  function handleCategorySelect(slug: string | null) {
    setSelectedCategory(slug)
  }

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-container px-6">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mono-label mb-3">This week</p>
            <h2 className="font-display text-4xl tracking-tight text-ink md:text-5xl">
              Products rising on BharatHunt
            </h2>
          </div>
          <p className="max-w-sm text-body-muted md:text-right">
            Community-ranked. Resets every Friday. One upvote per product — make it count.
          </p>
        </div>

        {categories.length > 0 || initialLoading ? (
          <CategoryChips
            categories={categories}
            selected={selectedCategory}
            onSelect={handleCategorySelect}
          />
        ) : null}

        {error && products.length === 0 ? (
          <ErrorState message={error} onRetry={handleRetry} />
        ) : null}

        {initialLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : null}

        {!initialLoading && !error && products.length === 0 ? (
          <EmptyState />
        ) : null}

        {!initialLoading && products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
              {loadingMore
                ? Array.from({ length: 3 }).map((_, i) => (
                    <ProductCardSkeleton key={`more-${i}`} />
                  ))
                : null}
            </div>

            {error ? (
              <div className="mt-8">
                <ErrorState message={error} onRetry={handleRetry} />
              </div>
            ) : null}

            <div ref={sentinelRef} className="h-8 w-full" aria-hidden />
          </>
        ) : null}
      </div>
    </section>
  )
}

function EmptyState() {
  return (
    <div className="rounded-sm bg-soft-stone px-8 py-16 text-center">
      <p className="font-display text-2xl tracking-tight text-ink">
        No products yet — be the first maker!
      </p>
      <p className="mt-3 text-body-muted">
        Launch a product this week and claim the top of the leaderboard.
      </p>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-sm border border-error/20 bg-soft-stone px-8 py-12 text-center">
      <p className="text-error">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center rounded-pill bg-primary px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </div>
  )
}
