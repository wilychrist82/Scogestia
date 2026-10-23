import { describe, it, expect, vi } from 'vitest';
import { getSchoolSubscriptionStatus, assertActiveSubscription } from '../lib/subscription';

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
});
