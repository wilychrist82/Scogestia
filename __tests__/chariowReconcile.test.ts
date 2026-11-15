import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reconcileChariowPayment } from '@/lib/chariow/reconcile';

const { mockGetChariowSaleStatus } = vi.hoisted(() => ({
  mockGetChariowSaleStatus: vi.fn(),
}));

vi.mock('@/lib/chariow/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/chariow/api')>();
  return {
    ...actual,
    getChariowSaleStatus: mockGetChariowSaleStatus,
  };
});

function buildFakeSupabase(options: {
  payment: Record<string, any> | null;
  subscription?: Record<string, any> | null;
}) {
  const updates: Array<{ table: string; payload: any; match: any }> = [];
  const inserts: Array<{ table: string; payload: any }> = [];

  const from = vi.fn((table: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn((_col: string, _val: any) => {
        const resultData =
          table === 'saas_payments'
            ? options.payment
            : table === 'saas_subscriptions'
              ? options.subscription ?? null
              : null;
        return {
          limit: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: resultData, error: null }),
          })),
          maybeSingle: vi.fn().mockResolvedValue({ data: resultData, error: null }),
        };
      }),
    })),
    update: vi.fn((payload: any) => ({
      eq: vi.fn((col: string, val: any) => {
        updates.push({ table, payload, match: { col, val } });
        return Promise.resolve({ error: null });
      }),
    })),
    insert: vi.fn((payload: any) => {
      inserts.push({ table, payload });
      return Promise.resolve({ error: null });
    }),
  }));

  return { client: { from } as any, updates, inserts };
}

describe('reconcileChariowPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('activates school and extends subscription by 12 months for Annuel plan', async () => {
    mockGetChariowSaleStatus.mockResolvedValue({
      status: 'settled',
      amount: { value: 80900 },
    });

    const { client, updates, inserts } = buildFakeSupabase({
      payment: {
        id: 'pay-1',
        school_id: 'school-1',
        provider_sale_id: 'sale_annual_1',
        amount: 80900,
        status: 'pending',
        plan_name: 'SCOGESTIA Plan Annuel',
      },
      subscription: null,
    });

    const ok = await reconcileChariowPayment('sale_annual_1', client);
    expect(ok).toBe(true);

    const paymentUpdate = updates.find((u) => u.table === 'saas_payments');
    expect(paymentUpdate?.payload.status).toBe('succeeded');

    const subInsert = inserts.find((i) => i.table === 'saas_subscriptions');
    expect(subInsert?.payload.status).toBe('active');
    const diffMonths =
      (new Date(subInsert!.payload.current_period_end).getFullYear() - new Date().getFullYear()) * 12 +
      (new Date(subInsert!.payload.current_period_end).getMonth() - new Date().getMonth());
    expect(diffMonths).toBeGreaterThanOrEqual(11);

    const schoolUpdate = updates.find((u) => u.table === 'schools');
    expect(schoolUpdate?.payload).toMatchObject({
      subscription_status: 'active',
      subscription_plan: 'premium',
      max_students: 999999,
    });
  });

  it('rejects and marks payment failed when paid amount is lower than expected', async () => {
    mockGetChariowSaleStatus.mockResolvedValue({
      status: 'settled',
      amount: { value: 1000 },
    });

    const { client, updates } = buildFakeSupabase({
      payment: {
        id: 'pay-2',
        school_id: 'school-2',
        provider_sale_id: 'sale_fraud_1',
        amount: 9900,
        status: 'pending',
        plan_name: 'Plan Pro',
      },
    });

    const ok = await reconcileChariowPayment('sale_fraud_1', client);
    expect(ok).toBe(false);

    const paymentUpdate = updates.find((u) => u.table === 'saas_payments');
    expect(paymentUpdate?.payload.status).toBe('failed');
    expect(updates.find((u) => u.table === 'schools')).toBeUndefined();
  });
});
