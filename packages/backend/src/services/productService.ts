import { db } from '../db'
import { slugify } from '../shared/utils'
import { AppError } from '../middleware/errorHandler'
import type { ProductResponse, PaginatedResponse } from '@bh/shared/types'

interface ListParams {
  cursor?: string
  category?: string
  week?: string
}

export const productService = {
  async list(params: ListParams): Promise<PaginatedResponse<ProductResponse>> {
    const where: any = {
      status: 'submitted',
      launchedAt: { not: null },
    }

    if (params.category) {
      where.category = { slug: params.category }
    }

    if (params.week) {
      // Parse week string like "2026-W30"
      // TODO: implement weekly date range filtering
    }

    const products = await db.product.findMany({
      where,
      include: { maker: true, category: true, votes: true, comments: true },
      orderBy: { launchedAt: 'desc' },
      take: 21, // 20 + 1 for cursor detection
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    })

    const hasMore = products.length > 20
    const data = products.slice(0, 20)

    return {
      data: data.map(p => ({
        ...p,
        voteCount: p.votes.length,
        commentCount: p.comments.length,
        hasVoted: false,
        maker: p.maker,
        galleryUrls: p.galleryUrls as string[],
        demoUrl: p.demoUrl,
        videoUrl: p.videoUrl,
        launchedAt: p.launchedAt?.toISOString() || '',
        scheduledFor: p.scheduledFor?.toISOString() || null,
        createdAt: p.createdAt.toISOString(),
      })),
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    }
  },

  async getBySlug(slug: string): Promise<ProductResponse> {
    const product = await db.product.findUnique({
      where: { slug },
      include: { maker: true, category: true, votes: true, comments: true },
    })

    if (!product) throw AppError.notFound('Product')

    return {
      ...product,
      voteCount: product.votes.length,
      commentCount: product.comments.length,
      hasVoted: false,
      maker: product.maker,
      galleryUrls: product.galleryUrls as string[],
      demoUrl: product.demoUrl,
      videoUrl: product.videoUrl,
      launchedAt: product.launchedAt?.toISOString() || '',
      scheduledFor: product.scheduledFor?.toISOString() || null,
      createdAt: product.createdAt.toISOString(),
    }
  },

  async create(userId: string, data: any): Promise<ProductResponse> {
    const slug = slugify(data.name)

    // Check slug uniqueness
    const existing = await db.product.findUnique({ where: { slug } })
    if (existing) throw AppError.conflict('A product with this name already exists')

    // Verify category exists
    const category = await db.category.findUnique({ where: { id: data.categoryId } })
    if (!category) throw AppError.notFound('Category')

    // If scheduled, validate it's a future date
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
      include: { maker: true, category: true, votes: true, comments: true },
    })

    return {
      ...product,
      voteCount: 0,
      commentCount: 0,
      hasVoted: false,
      maker: product.maker,
      galleryUrls: product.galleryUrls as string[],
      demoUrl: product.demoUrl,
      videoUrl: product.videoUrl,
      launchedAt: product.launchedAt?.toISOString() || '',
      scheduledFor: product.scheduledFor?.toISOString() || null,
      createdAt: product.createdAt.toISOString(),
    }
  },

  async update(userId: string, slug: string, data: any) {
    const product = await db.product.findUnique({ where: { slug } })
    if (!product) throw AppError.notFound('Product')
    if (product.makerId !== userId) throw AppError.forbidden('You can only edit your own products')

    const updated = await db.product.update({
      where: { slug },
      data,
      include: { maker: true, category: true, votes: true, comments: true },
    })

    return {
      ...updated,
      voteCount: updated.votes.length,
      commentCount: updated.comments.length,
      hasVoted: false,
      maker: updated.maker,
      galleryUrls: updated.galleryUrls as string[],
      demoUrl: updated.demoUrl,
      videoUrl: updated.videoUrl,
      launchedAt: updated.launchedAt?.toISOString() || '',
      scheduledFor: updated.scheduledFor?.toISOString() || null,
      createdAt: updated.createdAt.toISOString(),
    }
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
