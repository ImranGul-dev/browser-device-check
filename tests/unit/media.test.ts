import { describe, expect, it, vi } from 'vitest';
import { mediaErrorMessage, stopStream } from '@/lib/media';

describe('media utilities', () => {
  it('stops every track in a media stream', () => {
    const stopA = vi.fn(); const stopB = vi.fn();
    stopStream({ getTracks: () => [{ stop: stopA }, { stop: stopB }] } as unknown as MediaStream);
    expect(stopA).toHaveBeenCalledOnce(); expect(stopB).toHaveBeenCalledOnce();
  });

  it('maps denied permissions to a calm recovery message', () => {
    const result = mediaErrorMessage(new DOMException('denied', 'NotAllowedError'), 'camera');
    expect(result.label).toBe('Permission blocked');
    expect(result.message).toContain('Reset the site permission');
  });

  it('does not overclaim a generic failure', () => {
    const result = mediaErrorMessage(new Error('unexpected'), 'microphone');
    expect(result.label).toBe('Test could not start');
    expect(result.message).toContain('No media was saved');
  });
});
