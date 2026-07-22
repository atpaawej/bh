import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import { authMiddleware, optionalAuthMiddleware } from './auth'
import { config } from '../config'
import { AppError } from './errorHandler'

function mockReq(authHeader?: string): Request {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as Request
}

function mockRes(): Response {
  return {} as Response
}

describe('authMiddleware', () => {
  let next: NextFunction

  beforeEach(() => {
    next = vi.fn()
  })

  it('attaches user from a valid JWT', () => {
    const token = jwt.sign(
      { email: 'asha@example.com', name: 'Asha', avatarUrl: null },
      config.JWT_SECRET,
      { subject: 'user-1', expiresIn: '15m' }
    )
    const req = mockReq(`Bearer ${token}`)

    authMiddleware(req, mockRes(), next)

    expect(req.user).toEqual({
      id: 'user-1',
      email: 'asha@example.com',
      name: 'Asha',
      avatarUrl: null,
    })
    expect(next).toHaveBeenCalledWith()
  })

  it('rejects missing authorization header', () => {
    expect(() => authMiddleware(mockReq(), mockRes(), next)).toThrow(AppError)
    try {
      authMiddleware(mockReq(), mockRes(), next)
    } catch (err) {
      expect(err).toMatchObject({ status: 401, message: 'Missing or invalid authorization header' })
    }
  })

  it('rejects non-Bearer schemes', () => {
    expect(() => authMiddleware(mockReq('Basic abc'), mockRes(), next)).toThrow(AppError)
  })

  it('rejects expired tokens', () => {
    const token = jwt.sign(
      { email: 'asha@example.com', name: 'Asha', avatarUrl: null },
      config.JWT_SECRET,
      { subject: 'user-1', expiresIn: -10 }
    )

    try {
      authMiddleware(mockReq(`Bearer ${token}`), mockRes(), next)
      expect.fail('should have thrown')
    } catch (err) {
      expect(err).toMatchObject({ status: 401, message: 'Token expired' })
    }
  })

  it('rejects malformed tokens', () => {
    try {
      authMiddleware(mockReq('Bearer not-a-jwt'), mockRes(), next)
      expect.fail('should have thrown')
    } catch (err) {
      expect(err).toMatchObject({ status: 401, message: 'Invalid token' })
    }
  })

  it('rejects tokens signed with the wrong secret', () => {
    const token = jwt.sign(
      { email: 'asha@example.com', name: 'Asha', avatarUrl: null },
      'wrong-secret-that-is-at-least-32-chars!!',
      { subject: 'user-1', expiresIn: '15m' }
    )

    try {
      authMiddleware(mockReq(`Bearer ${token}`), mockRes(), next)
      expect.fail('should have thrown')
    } catch (err) {
      expect(err).toMatchObject({ status: 401, message: 'Invalid token' })
    }
  })
})

describe('optionalAuthMiddleware', () => {
  let next: NextFunction

  beforeEach(() => {
    next = vi.fn()
  })

  it('attaches user when a valid token is present', () => {
    const token = jwt.sign(
      { email: 'asha@example.com', name: 'Asha', avatarUrl: 'https://x.com/a.png' },
      config.JWT_SECRET,
      { subject: 'user-1', expiresIn: '15m' }
    )
    const req = mockReq(`Bearer ${token}`)

    optionalAuthMiddleware(req, mockRes(), next)

    expect(req.user).toEqual({
      id: 'user-1',
      email: 'asha@example.com',
      name: 'Asha',
      avatarUrl: 'https://x.com/a.png',
    })
    expect(next).toHaveBeenCalled()
  })

  it('passes through when no token is present', () => {
    const req = mockReq()
    optionalAuthMiddleware(req, mockRes(), next)
    expect(req.user).toBeUndefined()
    expect(next).toHaveBeenCalled()
  })

  it('passes through when token is invalid without throwing', () => {
    const req = mockReq('Bearer garbage')
    optionalAuthMiddleware(req, mockRes(), next)
    expect(req.user).toBeUndefined()
    expect(next).toHaveBeenCalled()
  })

  it('passes through when token is expired without throwing', () => {
    const token = jwt.sign(
      { email: 'asha@example.com', name: 'Asha', avatarUrl: null },
      config.JWT_SECRET,
      { subject: 'user-1', expiresIn: -10 }
    )
    const req = mockReq(`Bearer ${token}`)

    optionalAuthMiddleware(req, mockRes(), next)

    expect(req.user).toBeUndefined()
    expect(next).toHaveBeenCalled()
  })
})
