import { describe, it, expect, vi } from 'vitest';
import { getSchoolSubscriptionStatus, assertActiveSubscription, inferPlanDetails } from '../lib/subscription';
import { isBillingTestEmail, isOwnerEmail } from '../lib/owner';
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

  it('authorizes configured billing test email without granting owner privileges', () => {
    expect(isBillingTestEmail('alicisme30@gmail.com')).toBe(true);
    expect(isOwnerEmail('alicisme30@gmail.com')).toBe(false);
    expect(isBillingTestEmail('autre-ecole@exemple.com')).toBe(false);
  });
});
