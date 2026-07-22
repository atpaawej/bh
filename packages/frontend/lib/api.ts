import type { CategoryResponse, PaginatedResponse, ProductResponse } from '@bh/shared'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      cache: 'no-store',
    })
  } catch {
    throw new ApiClientError('Unable to reach the server. Check your connection.', 0)
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    let code: string | undefined
    try {
      const body = (await res.json()) as { message?: string; code?: string }
      if (body.message) message = body.message
      code = body.code
    } catch {
      // ignore parse errors
    }
    throw new ApiClientError(message, res.status, code)
  }

  return res.json() as Promise<T>
}

export interface ProductListParams {
  cursor?: string | null
  category?: string | null
  week?: string | null
}

export function fetchProducts(params: ProductListParams = {}): Promise<PaginatedResponse<ProductResponse>> {
  const search = new URLSearchParams()
  if (params.cursor) search.set('cursor', params.cursor)
  if (params.category) search.set('category', params.category)
  if (params.week) search.set('week', params.week)
  const qs = search.toString()
  return request(`/products${qs ? `?${qs}` : ''}`)
}

export function fetchCategories(): Promise<CategoryResponse[]> {
  return request('/categories')
}
