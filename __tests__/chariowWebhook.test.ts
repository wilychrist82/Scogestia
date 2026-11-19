import crypto from 'crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockCheckRateLimit,
  mockReconcileChariowPayment,
  mockCreateServiceRoleClient,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockCheckRateLimit: vi.fn(),
  mockReconcileChariowPayment: vi.fn(),
  mockCreateServiceRoleClient: vi.fn(),
  mockRevalidatePath: vi.fn(),
}))

vi.mock('@/lib/ratelimit', () => ({
  webhookRateLimit: null,
  checkRateLimit: mockCheckRateLimit,
}))

vi.mock('@/lib/chariow/reconcile', () => ({
  reconcileChariowPayment: mockReconcileChariowPayment,
}))

vi.mock('@/lib/supabase/service', () => ({
  createServiceRoleClient: mockCreateServiceRoleClient,
}))

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}))

import { POST } from '@/app/api/webhooks/chariow/route'
import { verifyChariowWebhookRequest } from '@/lib/chariow/webhook'

describe('Chariow Pulse Webhook (/api/webhooks/chariow)', () => {
  const ORIGINAL_SECRET = process.env.CHARIOW_WEBHOOK_SECRET

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CHARIOW_WEBHOOK_SECRET = 'test_webhook_secret_123'
    mockCheckRateLimit.mockResolvedValue({ success: true })
    mockCreateServiceRoleClient.mockReturnValue({})
    mockReconcileChariowPayment.mockResolvedValue(true)
  })

  afterEach(() => {
    if (ORIGINAL_SECRET === undefined) {
      delete process.env.CHARIOW_WEBHOOK_SECRET
    } else {
      process.env.CHARIOW_WEBHOOK_SECRET = ORIGINAL_SECRET
    }
  })

  it('accepts ?secret= query parameter matching CHARIOW_WEBHOOK_SECRET', async () => {
    const payload = JSON.stringify({
      event: 'successful.sale',
      data: { id: 'SALETN59SU89E7RKEOF' },
    })

    const req = new Request(
      'https://scogestia.vercel.app/api/webhooks/chariow?secret=test_webhook_secret_123',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
      },
    )

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockReconcileChariowPayment).toHaveBeenCalledWith('SALETN59SU89E7RKEOF', {})
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin', 'layout')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/abonnement')
  })

  it('accepts official Chariow HMAC signature (x-chariow-signature) and x-pulse-event header', async () => {
    const payload = JSON.stringify({
      data: { purchase: { id: 'SALE_HMAC_1' } },
    })
    const hmac = crypto
      .createHmac('sha256', 'test_webhook_secret_123')
      .update(payload)
      .digest('hex')

    const req = new Request('https://www.scogestia.com/api/webhooks/chariow', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-chariow-signature': `sha256=${hmac}`,
        'x-pulse-event': 'successful.sale',
      },
      body: payload,
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockReconcileChariowPayment).toHaveBeenCalledWith('SALE_HMAC_1', {})
  })

  it('rejects requests with wrong secret and invalid HMAC signature with 401', async () => {
    const req = new Request(
      'https://scogestia.vercel.app/api/webhooks/chariow?secret=wrong_secret',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event: 'successful.sale', data: { id: 'SALE1' } }),
      },
    )

    const res = await POST(req)
    expect(res.status).toBe(401)
    expect(mockReconcileChariowPayment).not.toHaveBeenCalled()
  })

  it('returns 200 gracefully on dashboard test_sale or ping payloads', async () => {
    const reqPing = new Request(
      'https://scogestia.vercel.app/api/webhooks/chariow?secret=test_webhook_secret_123',
      { method: 'POST', body: '{}' },
    )
    const resPing = await POST(reqPing)
    expect(resPing.status).toBe(200)

    const reqTestSale = new Request(
      'https://scogestia.vercel.app/api/webhooks/chariow?secret=test_webhook_secret_123',
      {
        method: 'POST',
        body: JSON.stringify({ event: 'successful.sale', data: { id: 'test_sale_123' } }),
      },
    )
    const resTestSale = await POST(reqTestSale)
    expect(resTestSale.status).toBe(200)
    expect(mockReconcileChariowPayment).not.toHaveBeenCalled()
    expect(verifyChariowWebhookRequest(reqTestSale, '', ['test_webhook_secret_123'])).toBe(true)
  })
})
