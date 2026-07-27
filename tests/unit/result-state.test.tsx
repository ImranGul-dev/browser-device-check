import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResultState } from '@/components/tools/ResultState';

describe('ResultState', () => {
  it('renders a non-color status label and explanation', () => {
    render(<ResultState tone="warning" label="Input may be low"><p>Move closer and retry.</p></ResultState>);
    expect(screen.getByText('Input may be low')).toBeVisible();
    expect(screen.getByText('Move closer and retry.')).toBeVisible();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('can suppress live-region semantics for rapidly changing summaries', () => {
    render(<ResultState tone="success" label="Events received" announce={false}><p>12 events</p></ResultState>);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('Events received')).toBeVisible();
  });

  it('uses alert semantics for errors', () => {
    render(<ResultState tone="error" label="Permission blocked"><p>Reset permission.</p></ResultState>);
    expect(screen.getByRole('alert')).toHaveTextContent('Permission blocked');
  });
});
