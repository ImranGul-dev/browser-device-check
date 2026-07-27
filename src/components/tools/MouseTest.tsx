import { MousePointer2, RotateCcw, Square } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { ResultState } from './ResultState';

type CountKey =
  | 'left'
  | 'middle'
  | 'right'
  | 'back'
  | 'forward'
  | 'double'
  | 'wheelUp'
  | 'wheelDown'
  | 'moves'
  | 'drags';
type Counts = Record<CountKey, number>;
const initial: Counts = {
  left: 0,
  middle: 0,
  right: 0,
  back: 0,
  forward: 0,
  double: 0,
  wheelUp: 0,
  wheelDown: 0,
  moves: 0,
  drags: 0,
};

export default function MouseTest() {
  const [active, setActive] = useState(false);
  const [counts, setCounts] = useState<Counts>(initial);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 50, y: 50 });
  const targetRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const pendingMovesRef = useRef(0);
  const pendingPositionRef = useRef({ x: 0, y: 0 });
  const pendingDragPositionRef = useRef<{ x: number; y: number } | null>(null);

  const update = (key: CountKey) =>
    setCounts((current) => ({ ...current, [key]: (current[key] ?? 0) + 1 }));

  const flushPointerActivity = () => {
    frameRef.current = null;
    const moveCount = pendingMovesRef.current;
    pendingMovesRef.current = 0;
    setPosition(pendingPositionRef.current);
    if (pendingDragPositionRef.current) {
      setDragPosition(pendingDragPositionRef.current);
      pendingDragPositionRef.current = null;
    }
    if (moveCount > 0) {
      setCounts((current) => ({ ...current, moves: current.moves + moveCount }));
    }
  };

  const schedulePointerFlush = () => {
    if (frameRef.current === null) frameRef.current = requestAnimationFrame(flushPointerActivity);
  };

  const buttonName = (button: number): CountKey =>
    button === 0
      ? 'left'
      : button === 1
        ? 'middle'
        : button === 2
          ? 'right'
          : button === 3
            ? 'back'
            : button === 4
              ? 'forward'
              : 'left';

  const pointerDown = (event: ReactPointerEvent) => {
    if (!active) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    update(buttonName(event.button));
    if ((event.target as HTMLElement).closest('.drag-target')) {
      setDragging(true);
      update('drags');
    }
  };

  const pointerMove = (event: ReactPointerEvent) => {
    if (!active) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    pendingPositionRef.current = { x, y };
    pendingMovesRef.current += 1;
    if (dragging) {
      pendingDragPositionRef.current = {
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
      };
    }
    schedulePointerFlush();
  };

  const wheel = (event: ReactWheelEvent) => {
    if (!active) return;
    event.preventDefault();
    update(event.deltaY < 0 ? 'wheelUp' : 'wheelDown');
  };

  const reset = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    pendingMovesRef.current = 0;
    pendingDragPositionRef.current = null;
    setCounts(initial);
    setPosition({ x: 0, y: 0 });
    setDragPosition({ x: 50, y: 50 });
    setDragging(false);
  };

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const totalButtons =
    counts.left + counts.middle + counts.right + counts.back + counts.forward;

  return (
    <div className="tool-shell" aria-labelledby="mouse-tool-title">
      <div className="tool-shell__header">
        <div>
          <strong id="mouse-tool-title">Pointer, button, drag, and wheel test</strong>
          <div className="help-text">
            Activity is processed only in this browser and is not stored by the tool.
          </div>
        </div>
        <span>{active ? 'Test active' : 'Test inactive'}</span>
      </div>
      <div className="tool-shell__body">
        <div
          ref={targetRef}
          className={`mouse-target ${active ? 'active' : ''}`}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onDoubleClick={() => active && update('double')}
          onWheel={wheel}
          onContextMenu={(event: ReactMouseEvent<HTMLDivElement>) => active && event.preventDefault()}
          role="region"
          aria-label="Mouse testing target"
        >
          {!active ? (
            <div>
              <MousePointer2 size={42} />
              <h2>Move and click inside this target</h2>
              <p>Right-click suppression is limited to this area while the test is active.</p>
              <button className="btn btn-primary" type="button" onClick={() => setActive(true)}>
                Start Mouse Test
              </button>
            </div>
          ) : (
            <div
              className="drag-target"
              style={{
                position: 'absolute',
                left: `${dragPosition.x}%`,
                top: `${dragPosition.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              Drag me
            </div>
          )}
        </div>
        <div className="button-row" style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary" type="button" onClick={() => setActive(true)}>
            Start Mouse Test
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => setActive(false)}>
            <Square size={18} />
            Exit Mouse Test
          </button>
          <button className="btn btn-secondary" type="button" onClick={reset}>
            <RotateCcw size={18} />
            Reset Results
          </button>
        </div>
        <dl className="metric-list">
          <div className="metric">
            <dt>Left / middle / right</dt>
            <dd>
              {counts.left} / {counts.middle} / {counts.right}
            </dd>
          </div>
          <div className="metric">
            <dt>Back / forward</dt>
            <dd>
              {counts.back} / {counts.forward}
            </dd>
          </div>
          <div className="metric">
            <dt>Double clicks</dt>
            <dd>{counts.double}</dd>
          </div>
          <div className="metric">
            <dt>Wheel up / down</dt>
            <dd>
              {counts.wheelUp} / {counts.wheelDown}
            </dd>
          </div>
          <div className="metric">
            <dt>Movement events</dt>
            <dd>{counts.moves}</dd>
          </div>
          <div className="metric">
            <dt>Position in target</dt>
            <dd>
              {Math.round(position.x)}, {Math.round(position.y)}
            </dd>
          </div>
        </dl>
        {totalButtons > 0 && (
          <ResultState tone="success" label="Pointer button events received" announce={false}>
            <p>
              The browser received {totalButtons} button event{totalButtons === 1 ? '' : 's'} in the
              active target.
            </p>
          </ResultState>
        )}
        {active && counts.moves === 0 && (
          <ResultState tone="info" label="Move the pointer">
            <p>
              Movement, buttons, double-click, wheel direction, and dragging are summarized after
              events reach the target.
            </p>
          </ResultState>
        )}
        <ResultState tone="info" label="Measurement limitation">
          <p>
            This tool does not claim exact hardware DPI or polling rate. Browser event counts and
            timing can be affected by the operating system, browser, zoom, and rendering load.
          </p>
        </ResultState>
      </div>
    </div>
  );
}
