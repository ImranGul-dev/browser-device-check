import { describe, expect, it } from 'vitest';
import { estimateRefreshRate } from '@/lib/refresh-rate';

describe('estimateRefreshRate', () => {
  it('estimates a stable 60 Hz sample', () => {
    const timestamps = Array.from({ length: 181 }, (_, index) => index * (1000 / 60));
    const result = estimateRefreshRate(timestamps);
    expect(result?.hz).toBeCloseTo(60, 1);
    expect(result?.longFrames).toBe(0);
  });

  it('returns null for an insufficient sample', () => {
    expect(estimateRefreshRate([0, 16, 32])).toBeNull();
  });
});
