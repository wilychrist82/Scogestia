import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  signPendingCheckoutToken,
  verifyPendingCheckoutToken,
} from '@/lib/chariow/pending-token'
import { reconcilePendingCheckoutToken } from '@/lib/chariow/reconcile'

const { mockGetChariowSaleStatus } = vi.hoisted(() => ({
  mockGetChariowSaleStatus: vi.fn(),
}))

vi.mock('@/lib/chariow/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/chariow/api')>()
  return {
    ...actual,
    getChariowSaleStatus: mockGetChariowSaleStatus,
  }
})

describe('chariow pending-token HMAC & fallback reconciliation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('signs and verifies valid payload and rejects tampering or expired tokens', () => {
    const secret = 'test-hmac-secret-32-chars-minimum'
    const token = signPendingCheckoutToken(
      {
        saleId: 'SALE_123',
        schoolId: 'school-abc',
        planName: 'SCOGESTIA-Pan Standard',
        expectedAmount: 7000,
        exp: Date.now() + 60_000,
      },
      secret,
    )

    expect(token).toBeTruthy()
    const parsed = verifyPendingCheckoutToken(token, secret)
    expect(parsed).toMatchObject({
      saleId: 'SALE_123',
      schoolId: 'school-abc',
      planName: 'SCOGESTIA-Pan Standard',
      expectedAmount: 7000,
    })

    // Falsification du payload ou mauvaise clé -> rejeté
    const [payloadB64, sig] = token!.split('.')
    const tampered = `${payloadB64.slice(0, -1)}X.${sig}`
    expect(verifyPendingCheckoutToken(tampered, secret)).toBeNull()
    expect(verifyPendingCheckoutToken(token, 'wrong-secret')).toBeNull()

    // Jeton expiré -> rejeté
    const expiredToken = signPendingCheckoutToken(
      {
        saleId: 'SALE_123',
        schoolId: 'school-abc',
        planName: 'Standard',
        expectedAmount: 7000,
        exp: Date.now() - 1000,
      },
      secret,
    )
    expect(verifyPendingCheckoutToken(expiredToken, secret)).toBeNull()
  })

  it('activates school via reconcilePendingCheckoutToken even if saas_payments returns 42501', async () => {
    mockGetChariowSaleStatus.mockResolvedValue({
      status: 'settled',
      amount: { value: 7000, currency: 'XOF' },
    })

    const schoolUpdates: any[] = []
    const client = {
      from: vi.fn((table: string) => {
        if (table === 'saas_payments') {
          return {
            upsert: vi.fn().mockResolvedValue({
              error: { code: '42501', message: 'permission denied for table saas_payments' },
            }),
          }
        }
        if (table === 'saas_subscriptions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: '42501', message: 'permission denied for table saas_subscriptions' },
                  }),
                })),
              })),
            })),
          }
        }
        if (table === 'schools') {
          return {
            update: vi.fn((payload: any) => ({
              eq: vi.fn((col: string, val: any) => {
                schoolUpdates.push({ payload, col, val })
                return Promise.resolve({ error: null })
              }),
            })),
          }
        }
        return {}
      }),
    } as any

    const ok = await reconcilePendingCheckoutToken(client, {
      saleId: 'SALE_OK_1',
      schoolId: 'school-xyz',
      planName: 'SCOGESTIA-Pan Standard',
      expectedAmount: 7000,
    })

    expect(ok).toBe(true)
    expect(schoolUpdates).toHaveLength(1)
    expect(schoolUpdates[0].val).toBe('school-xyz')
    expect(schoolUpdates[0].payload).toMatchObject({
      subscription_status: 'active',
      subscription_plan: 'starter',
      max_students: 200,
    })
  })

  it('rejects fallback activation when Chariow reports underpayment or unpaid status', async () => {
    mockGetChariowSaleStatus.mockResolvedValue({
      status: 'settled',
      amount: { value: 1000, currency: 'XOF' },
    })

    const client = { from: vi.fn() } as any
    const ok = await reconcilePendingCheckoutToken(client, {
      saleId: 'SALE_LOW',
      schoolId: 'school-xyz',
      planName: 'SCOGESTIA-Pan Standard',
      expectedAmount: 7000,
    })

    expect(ok).toBe(false)
    expect(client.from).not.toHaveBeenCalled()
  })
})
