import { Hand, RotateCcw, Square } from 'lucide-react';
import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ResultState } from './ResultState';

const columns = 8;
const rows = 6;
const total = columns * rows;

export default function TouchscreenTest() {
  const [active, setActive] = useState(false);
  const [covered, setCovered] = useState<Set<number>>(new Set());
  const [activePointers, setActivePointers] = useState<Set<number>>(new Set());
  const [maxTouches, setMaxTouches] = useState(0);
  const [unexpected, setUnexpected] = useState(0);
  const lastPointerAt = useRef(0);

  const mark = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!active || event.pointerType !== 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const col = Math.max(0, Math.min(columns - 1, Math.floor(((event.clientX - rect.left) / rect.width) * columns)));
    const row = Math.max(0, Math.min(rows - 1, Math.floor(((event.clientY - rect.top) / rect.height) * rows)));
    const index = row * columns + col;
    setCovered((current) => new Set(current).add(index));
  };
  const down = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!active || event.pointerType !== 'touch') return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const now = performance.now();
    if (now - lastPointerAt.current < 18 && activePointers.size === 0) setUnexpected((value) => value + 1);
    lastPointerAt.current = now;
    setActivePointers((current) => { const next = new Set(current).add(event.pointerId); setMaxTouches((maximum) => Math.max(maximum, next.size)); return next; });
    mark(event);
  };
  const up = (event: ReactPointerEvent<HTMLDivElement>) => setActivePointers((current) => { const next = new Set(current); next.delete(event.pointerId); return next; });
  const percent = Math.round((covered.size / total) * 100);
  const milestone = useMemo(() => percent >= 100 ? 'All cells covered' : percent >= 75 ? '75 percent covered' : percent >= 50 ? '50 percent covered' : percent >= 25 ? '25 percent covered' : 'Coverage started', [percent]);
  const reset = () => { setCovered(new Set()); setActivePointers(new Set()); setMaxTouches(0); setUnexpected(0); };

  return <div className="tool-shell" aria-labelledby="touch-tool-title">
    <div className="tool-shell__header"><div><strong id="touch-tool-title">Touch coverage and multi-touch test</strong><div className="help-text">Touch locations remain in this browser session and are not uploaded.</div></div><span>{active ? 'Touch test active' : 'Touch test inactive'}</span></div>
    <div className="tool-shell__body">
      {!active && <ResultState tone="info" label="Touch hardware required"><p>Use a finger on a touchscreen. Mouse and trackpad input do not count as touch coverage. Ordinary page controls remain available through other input methods.</p></ResultState>}
      <div className={`touch-grid ${active ? 'active' : ''}`} onPointerDown={down} onPointerMove={mark} onPointerUp={up} onPointerCancel={up} role="region" aria-label="Touch coverage grid. A text summary follows this grid.">
        {Array.from({ length: total }, (_, index) => <div key={index} className={`touch-cell ${covered.has(index) ? 'covered' : ''}`} aria-hidden="true" />)}
      </div>
      <div className="button-row" style={{ marginTop: '1rem' }}><button className="btn btn-primary" type="button" onClick={() => setActive(true)}><Hand size={18} />Start Touchscreen Test</button><button className="btn btn-secondary" type="button" onClick={() => setActive(false)}><Square size={18} />Exit Touchscreen Test</button><button className="btn btn-secondary" type="button" onClick={reset}><RotateCcw size={18} />Reset Results</button></div>
      <dl className="metric-list"><div className="metric"><dt>Grid coverage</dt><dd>{covered.size} of {total} cells ({percent}%)</dd></div><div className="metric"><dt>Simultaneous touch points</dt><dd>{maxTouches}</dd></div><div className="metric"><dt>Possible unexpected bursts</dt><dd>{unexpected}</dd></div></dl>
      <p className="sr-only" aria-live="polite">{covered.size ? milestone : ''}{maxTouches > 1 ? `. ${maxTouches} touch points detected.` : ''}</p>
      {percent === 100 && <ResultState tone="success" label="Coverage completed"><p>You traced every grid region during this session. This does not certify sensor calibration or rule out intermittent problems.</p></ResultState>}
      {percent > 0 && percent < 100 && <ResultState tone="incomplete" label="Coverage incomplete"><p>{milestone}. Trace the remaining unmarked areas slowly, then retry any persistent missed region.</p></ResultState>}
      {maxTouches > 1 && <ResultState tone="success" label="Multiple touch points detected"><p>The browser received up to {maxTouches} simultaneous touch pointers.</p></ResultState>}
      {active && covered.size === 0 && <ResultState tone="info" label="Touch the grid"><p>Drag a finger across the grid. The tool announces meaningful milestones instead of every movement.</p></ResultState>}
    </div>
  </div>;
}
