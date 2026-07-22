import { db } from '../db'
import { toCategoryResponse } from './productMapper'
import type { CategoryResponse } from '@bh/shared'

export const categoryService = {
  async list(): Promise<CategoryResponse[]> {
    const categories = await db.category.findMany({
      orderBy: { name: 'asc' },
    })
    return categories.map(toCategoryResponse)
  },
}
