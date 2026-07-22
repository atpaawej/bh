import { db } from '../db'
import { slugify } from '../shared/utils'
import { resolveWeekRange } from '../shared/week'
import { AppError } from '../middleware/errorHandler'
import { toProductResponse } from './productMapper'
import type { ProductResponse, PaginatedResponse } from '@bh/shared'

const PAGE_SIZE = 20

interface ListParams {
  cursor?: string
  category?: string
  week?: string
}

const productInclude = {
  maker: true,
  category: true,
  _count: { select: { votes: true, comments: true } },
} as const

function withCounts<T extends { _count: { votes: number; comments: number }; galleryUrls: string[] }>(
  product: T
) {
  const { _count, ...rest } = product
  return {
    ...rest,
    galleryUrls: rest.galleryUrls,
    voteCount: _count.votes,
    commentCount: _count.comments,
  }
}

export const productService = {
  /**
   * List products for a weekly window, ranked by vote count (desc).
   * Defaults to the current Friday→Thursday window when `week` is omitted.
   */
  async list(params: ListParams): Promise<PaginatedResponse<ProductResponse>> {
    let weekRange
    try {
      weekRange = resolveWeekRange(params.week)
    } catch {
      throw AppError.validation('Invalid week format. Expected YYYY-Wnn (e.g. 2026-W30)')
    }

    const where: {
      status: { in: Array<'submitted' | 'featured'> }
      launchedAt: { gte: Date; lte: Date }
      category?: { slug: string }
    } = {
      status: { in: ['submitted', 'featured'] },
      launchedAt: {
        gte: weekRange.start,
        lte: weekRange.end,
      },
    }

    if (params.category) {
      where.category = { slug: params.category }
    }

    const products = await db.product.findMany({
      where,
      include: productInclude,
      orderBy: [
        { votes: { _count: 'desc' } },
        { id: 'desc' },
      ],
      take: PAGE_SIZE + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    })

    const hasMore = products.length > PAGE_SIZE
    const page = products.slice(0, PAGE_SIZE)

    return {
      data: page.map((p) => toProductResponse(withCounts(p))),
      nextCursor: hasMore ? page[page.length - 1].id : null,
      hasMore,
    }
  },

  async getBySlug(slug: string, userId?: string): Promise<ProductResponse> {
    const product = await db.product.findUnique({
      where: { slug },
      include: productInclude,
    })

    // Drafts and other non-public statuses stay hidden (list already scopes this way)
    if (!product || (product.status !== 'submitted' && product.status !== 'featured')) {
      throw AppError.notFound('Product')
    }

    let hasVoted = false
    if (userId) {
      const vote = await db.vote.findUnique({
        where: { userId_productId: { userId, productId: product.id } },
      })
      hasVoted = !!vote
    }

    return toProductResponse({ ...withCounts(product), hasVoted })
  },

  async create(userId: string, data: {
    name: string
    tagline: string
    description: string
    websiteUrl: string
    demoUrl?: string
    categoryId: string
    logoUrl: string
    heroImageUrl: string
    galleryUrls?: string[]
    videoUrl?: string
    scheduledFor?: string
  }): Promise<ProductResponse> {
    const slug = slugify(data.name)

    const existing = await db.product.findUnique({ where: { slug } })
    if (existing) throw AppError.conflict('A product with this name already exists')

    const category = await db.category.findUnique({ where: { id: data.categoryId } })
    if (!category) throw AppError.notFound('Category')

    const isScheduled = !!data.scheduledFor
    const launchedAt = isScheduled ? null : new Date()

    const product = await db.product.create({
      data: {
        name: data.name,
        slug,
        tagline: data.tagline,
        description: data.description,
        websiteUrl: data.websiteUrl,
        demoUrl: data.demoUrl || null,
        categoryId: data.categoryId,
        logoUrl: data.logoUrl,
        heroImageUrl: data.heroImageUrl,
        galleryUrls: data.galleryUrls || [],
        videoUrl: data.videoUrl || null,
        status: isScheduled ? 'draft' : 'submitted',
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        launchedAt,
        makerId: userId,
      },
      include: productInclude,
    })

    return toProductResponse(withCounts(product))
  },

  async update(userId: string, slug: string, data: Record<string, unknown>) {
    const product = await db.product.findUnique({ where: { slug } })
    if (!product) throw AppError.notFound('Product')
    if (product.makerId !== userId) throw AppError.forbidden('You can only edit your own products')

    const updated = await db.product.update({
      where: { slug },
      data,
      include: productInclude,
    })

    return toProductResponse(withCounts(updated))
  },

  async remove(userId: string, slug: string) {
    const product = await db.product.findUnique({ where: { slug } })
    if (!product) throw AppError.notFound('Product')
    if (product.makerId !== userId) throw AppError.forbidden('You can only delete your own products')

    await db.product.delete({ where: { slug } })
  },

  async vote(userId: string, slug: string) {
    const product = await db.product.findUnique({ where: { slug } })
    if (!product) throw AppError.notFound('Product')

    const existingVote = await db.vote.findUnique({
      where: { userId_productId: { userId, productId: product.id } },
    })
    if (existingVote) throw AppError.conflict('Already voted')

    return db.vote.create({
      data: { userId, productId: product.id },
    })
  },

  async unvote(userId: string, slug: string) {
    const product = await db.product.findUnique({ where: { slug } })
    if (!product) throw AppError.notFound('Product')

    await db.vote.deleteMany({
      where: { userId, productId: product.id },
    })
  },
}
