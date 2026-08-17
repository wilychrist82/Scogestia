import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mocker NextResponse.next et NextResponse.redirect
const { mockNext, mockRedirect } = vi.hoisted(() => {
  return {
    mockNext: vi.fn(() => ({
      cookies: {
        set: vi.fn(),
      }
    })),
    mockRedirect: vi.fn((url) => {
      return {
        status: 307,
        headers: new Map([['location', url.toString()]])
      }
    })
  }
})

vi.mock('next/server', () => {
  return {
    NextResponse: {
      next: mockNext,
      redirect: mockRedirect
    },
    NextRequest: class MockNextRequest {
      nextUrl: any;
      cookies: { getAll: () => any[]; set: () => void };
      constructor(url: string) {
        this.nextUrl = new URL(url)
        this.nextUrl.clone = () => new URL(url)
        this.cookies = {
          getAll: () => [],
          set: () => {}
        }
      }
    }
  }
})

// Mock Supabase client
const { supabaseMockState } = vi.hoisted(() => {
  return {
    supabaseMockState: {
      mockUser: null as any,
      mockRole: null as string | null
    }
  }
})

vi.mock('@supabase/ssr', () => {
  return {
    createServerClient: () => ({
      auth: {
        getUser: vi.fn().mockImplementation(async () => {
          return { data: { user: supabaseMockState.mockUser } }
        })
      },
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation(async () => {
          if (supabaseMockState.mockRole) {
            return { data: [{ role: supabaseMockState.mockRole }] }
          }
          return { data: [] }
        })
      }))
    })
  }
})

import { middleware } from '../middleware'

describe('Middleware Route Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMockState.mockUser = null
    supabaseMockState.mockRole = null
  })

  it('devrait laisser passer un utilisateur non authentifié vers /connexion', async () => {
    const req = new NextRequest('http://localhost:3000/connexion') as any
    const res = await middleware(req)
    expect(mockNext).toHaveBeenCalled()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('devrait rediriger un utilisateur non authentifié depuis /admin vers /connexion', async () => {
    const req = new NextRequest('http://localhost:3000/admin') as any
    const res = await middleware(req)
    expect(mockRedirect).toHaveBeenCalled()
    const redirectUrl = mockRedirect.mock.calls[0][0]
    expect(redirectUrl.pathname).toBe('/connexion')
  })

  it('devrait bloquer un comptable accédant à /admin et le renvoyer vers /comptable', async () => {
    supabaseMockState.mockUser = { id: 'user-123' }
    supabaseMockState.mockRole = 'comptable'

    const req = new NextRequest('http://localhost:3000/admin/dashboard') as any
    const res = await middleware(req)
    
    expect(mockRedirect).toHaveBeenCalled()
    const redirectUrl = mockRedirect.mock.calls[0][0]
    expect(redirectUrl.pathname).toBe('/comptable')
  })

  it('devrait laisser passer un comptable accédant à /comptable', async () => {
    supabaseMockState.mockUser = { id: 'user-123' }
    supabaseMockState.mockRole = 'comptable'

    const req = new NextRequest('http://localhost:3000/comptable/factures') as any
    const res = await middleware(req)
    
    // Le NextResponse.next() a dû être retourné
    expect(res).toBeDefined()
    expect(mockRedirect).not.toHaveBeenCalled()
  })
})
