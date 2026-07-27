import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SpeakerTest from '@/components/tools/SpeakerTest';

describe('SpeakerTest', () => {
  it('does not autoplay and requires user confirmation', () => {
    render(<SpeakerTest />);
    expect(screen.getByText('Sound stopped')).toBeVisible();
    expect(screen.getByRole('button', { name: /play left channel/i })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /i heard nothing/i }));
    expect(screen.getByText('No sound confirmed')).toBeVisible();
  });
});
