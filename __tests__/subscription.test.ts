import { describe, it, expect, vi } from 'vitest';
import {
  getSchoolSubscriptionStatus,
  assertActiveSubscription,
  inferPlanDetails,
  formatSubscriptionPlanLabel,
  getPlanTierKey,
  addMonthsSafe,
} from '../lib/subscription';
import { isOwnerEmail } from '../lib/owner';
import { isTestChariowProduct, partitionChariowProducts } from '../lib/chariow/api';

function createTableMock(tables: Record<string, any>) {
  return {
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: tables[table] ?? null }),
        }),
      }),
    })),
  };
}

describe('SaaS Subscription & Multi-Tenant Entitlements', () => {
  it('identifies active school with starter plan defaults', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'school-1',
                name: 'École Test',
                subscription_status: 'active',
                subscription_plan: 'starter',
                max_students: 200,
                created_at: new Date().toISOString(),
              },
            }),
          }),
        }),
      }),
    };

    const status = await getSchoolSubscriptionStatus(mockSupabase, 'school-1');
    expect(status.isExpired).toBe(false);
    expect(status.status).toBe('active');
    expect(status.planName).toBe('starter');
    expect(status.maxStudents).toBe(200);
    expect(status.isPro).toBe(false);
  });

  it('identifies Pro school subscription', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'school-2',
                name: 'Collège Excellence',
                subscription_status: 'active',
                subscription_plan: 'pro',
                max_students: 500,
                created_at: new Date().toISOString(),
              },
            }),
          }),
        }),
      }),
    };

    const status = await getSchoolSubscriptionStatus(mockSupabase, 'school-2');
    expect(status.isExpired).toBe(false);
    expect(status.isPro).toBe(true);
    expect(status.maxStudents).toBe(500);
  });

  it('correctly handles suspended school and throws on assertActiveSubscription', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'school-suspended',
                name: 'École Suspendue',
                subscription_status: 'suspended',
                subscription_plan: 'starter',
                max_students: 200,
                created_at: new Date().toISOString(),
              },
            }),
          }),
        }),
      }),
    };

    const status = await getSchoolSubscriptionStatus(mockSupabase, 'school-suspended');
    expect(status.isExpired).toBe(true);
    expect(status.status).toBe('expired');
    expect(status.daysRemaining).toBe(0);

    await expect(assertActiveSubscription(mockSupabase, 'school-suspended')).rejects.toThrow(
      /Abonnement requis/
    );
  });

  it('detects expired trial or subscription from saas_subscriptions current_period_end', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const mockSupabase = createTableMock({
      schools: {
        id: 'school-exp',
        name: 'École Expirée',
        subscription_status: 'active',
        subscription_plan: 'starter',
        max_students: 200,
      },
      saas_subscriptions: {
        status: 'trial',
        plan_name: 'Essai Gratuit',
        current_period_end: yesterday,
      },
    });

    const status = await getSchoolSubscriptionStatus(mockSupabase, 'school-exp');
    expect(status.isExpired).toBe(true);
    expect(status.status).toBe('expired');
    expect(status.daysRemaining).toBe(0);
    await expect(assertActiveSubscription(mockSupabase, 'school-exp')).rejects.toThrow(/Abonnement requis/);
  });

  it('computes real remaining days for active trial in saas_subscriptions', async () => {
    const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const mockSupabase = createTableMock({
      schools: {
        id: 'school-trial',
        name: 'École Essai',
        subscription_status: 'active',
        subscription_plan: 'starter',
        max_students: 200,
      },
      saas_subscriptions: {
        status: 'trial',
        plan_name: 'Essai Gratuit',
        current_period_end: inSevenDays,
      },
    });

    const status = await getSchoolSubscriptionStatus(mockSupabase, 'school-trial');
    expect(status.isExpired).toBe(false);
    expect(status.status).toBe('trial');
    expect(status.daysRemaining).toBeGreaterThanOrEqual(7);
    expect(status.daysRemaining).toBeLessThanOrEqual(8);
  });

  it('infers plan metadata including Pro, Premium and Annuel durations/quotas', () => {
    expect(inferPlanDetails('Plan Standard')).toEqual({
      subscriptionPlan: 'starter',
      maxStudents: 200,
      monthsToAdd: 1,
      isPro: false,
    });
    expect(inferPlanDetails('Plan Pro')).toEqual({
      subscriptionPlan: 'pro',
      maxStudents: 400,
      monthsToAdd: 1,
      isPro: true,
    });
    expect(inferPlanDetails('SCOGESTIA Plan Annuel')).toEqual({
      subscriptionPlan: 'premium',
      maxStudents: 999999,
      monthsToAdd: 12,
      isPro: true,
    });
  });

  it('keeps low-price or test Chariow products hidden from schools and out of Plan Annuel', () => {
    const products = [
      { id: 'std', name: 'SCOGESTIA - Plan Standard', price: 7000, currency: 'FCFA', status: 'active' },
      { id: 'pro', name: 'SCOGESTIA - Plan Pro', price: 9900, currency: 'FCFA', status: 'active' },
      { id: 'low-ann', name: 'SCOGESTIA - Plan Annuel', price: 599, currency: 'FCFA', status: 'active' },
    ];

    expect(isTestChariowProduct(products[2])).toBe(true);
    expect(isTestChariowProduct(products[0])).toBe(false);

    const forNormalSchool = partitionChariowProducts(products, { canUseTestPlan: false });
    expect(forNormalSchool.publicPlans.map((p) => p.id)).toEqual(['std', 'pro']);
    expect(forNormalSchool.testPlan).toBeNull();

    const forTester = partitionChariowProducts(products, { canUseTestPlan: true });
    expect(forTester.publicPlans.map((p) => p.id)).toEqual(['std', 'pro']);
    expect(forTester.testPlan?.id).toBe('low-ann');
  });

  it('normalizes plan labels and tier keys for UI and billing automation', () => {
    expect(formatSubscriptionPlanLabel('SCOGESTIA-Pan Standard', 'active')).toBe('Plan Standard');
    expect(formatSubscriptionPlanLabel('SCOGESTIA-Pan pro', 'active')).toBe('Plan Pro');
    expect(formatSubscriptionPlanLabel('SCOGESTIA-Plan Annuel (copy)', 'active')).toBe('Plan Annuel');
    expect(formatSubscriptionPlanLabel('Essai Gratuit', 'trial')).toBe('Essai Gratuit');

    expect(getPlanTierKey('Essai Gratuit', 'trial')).toBe('trial');
    expect(getPlanTierKey('SCOGESTIA-Plan Standard', 'active')).toBe('standard');
    expect(getPlanTierKey('SCOGESTIA-Plan Pro', 'active')).toBe('pro');
    expect(getPlanTierKey('SCOGESTIA-Plan Annuel', 'active')).toBe('annuel');
    expect(isOwnerEmail('autre-ecole@exemple.com')).toBe(false);
  });

  it('adds months safely without end-of-month rollover overflow', () => {
    const jan31 = new Date(2026, 0, 31);
    const feb = addMonthsSafe(jan31, 1);
    expect(feb.getFullYear()).toBe(2026);
    expect(feb.getMonth()).toBe(1);
    expect(feb.getDate()).toBe(28);

    const nov30 = new Date(2026, 10, 30);
    const nextYear = addMonthsSafe(nov30, 12);
    expect(nextYear.getFullYear()).toBe(2027);
    expect(nextYear.getMonth()).toBe(10);
    expect(nextYear.getDate()).toBe(30);
  });

  it('respects explicit plan switches including downgrade from Annuel to Standard quota', async () => {
    const inThirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const mockSupabase = createTableMock({
      schools: {
        id: 'school-switch',
        name: 'École Switch',
        subscription_status: 'active',
        subscription_plan: 'premium',
        max_students: 999999,
      },
      saas_subscriptions: {
        status: 'active',
        plan_name: 'Plan Standard',
        current_period_end: inThirtyDays,
      },
    });

    const status = await getSchoolSubscriptionStatus(mockSupabase, 'school-switch');
    expect(status.status).toBe('active');
    expect(status.planName).toBe('Plan Standard');
    expect(status.isPro).toBe(false);
    expect(status.maxStudents).toBe(200);
  });
});
