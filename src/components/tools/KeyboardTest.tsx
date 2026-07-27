import { Keyboard, LogOut, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ResultState } from './ResultState';

const rows = [
  ['Escape','F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12','PrintScreen','ScrollLock','Pause'],
  ['Backquote','Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0','Minus','Equal','Backspace','Insert','Home','PageUp'],
  ['Tab','KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP','BracketLeft','BracketRight','Backslash','Delete','End','PageDown'],
  ['CapsLock','KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon','Quote','Enter'],
  ['ShiftLeft','KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM','Comma','Period','Slash','ShiftRight','ArrowUp'],
  ['ControlLeft','MetaLeft','AltLeft','Space','AltRight','MetaRight','ContextMenu','ControlRight','ArrowLeft','ArrowDown','ArrowRight'],
];

const labels: Record<string, string> = {
  Escape:'Esc', Backquote:'`', Minus:'-', Equal:'=', Backspace:'Backspace', Tab:'Tab', CapsLock:'Caps', Enter:'Enter',
  ShiftLeft:'Shift', ShiftRight:'Shift', ControlLeft:'Ctrl', ControlRight:'Ctrl', MetaLeft:'Meta', MetaRight:'Meta',
  AltLeft:'Alt', AltRight:'Alt', Space:'Space', ArrowLeft:'←', ArrowUp:'↑', ArrowDown:'↓', ArrowRight:'→',
  BracketLeft:'[', BracketRight:']', Backslash:'\\', Semicolon:';', Quote:"'", Comma:',', Period:'.', Slash:'/',
  PrintScreen:'PrtSc', ScrollLock:'ScrLk', Pause:'Pause', Insert:'Ins', Delete:'Del', Home:'Home', End:'End',
  PageUp:'PgUp', PageDown:'PgDn', ContextMenu:'Menu',
};
const wideKeys = new Set(['Backspace','Tab','CapsLock','Enter','ShiftLeft','ShiftRight','Space']);
const potentiallyReserved = new Set(['F1','F5','F11','PrintScreen','MetaLeft','MetaRight','ContextMenu','ScrollLock','Pause']);
const preventDefaultCodes = new Set([
  'Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Backspace','PageUp','PageDown','Home','End','Insert','Delete',
  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12','PrintScreen','ScrollLock','Pause','ContextMenu',
]);
const display = (code: string) => labels[code] ?? code.replace(/^(Key|Digit)/, '');

export default function KeyboardTest() {
  const [active, setActive] = useState(false);
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const [tested, setTested] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<string[]>([]);
  const [repeatCount, setRepeatCount] = useState(0);
  const [clock, setClock] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);
  const keyDownAt = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;

    const record = (event: KeyboardEvent) => {
      setTested((current) => new Set(current).add(event.code));
      setHistory((current) => [`${event.code} (${JSON.stringify(event.key)})${event.repeat ? ' - repeat' : ''}`, ...current].slice(0, 16));
    };

    const down = (event: KeyboardEvent) => {
      if (!active || document.activeElement !== area) return;
      record(event);

      if (event.key === 'Escape') {
        event.preventDefault();
        setActive(false);
        setPressed(new Set());
        keyDownAt.current.clear();
        return;
      }

      if (event.key === 'Tab') return;

      const hasShortcutModifier = event.ctrlKey || event.metaKey || event.altKey;
      if (!hasShortcutModifier && preventDefaultCodes.has(event.code)) event.preventDefault();
      if (event.repeat) setRepeatCount((value) => value + 1);
      keyDownAt.current.set(event.code, performance.now());
      setPressed((current) => new Set(current).add(event.code));
    };

    const up = (event: KeyboardEvent) => {
      if (!active) return;
      setPressed((current) => {
        const next = new Set(current);
        next.delete(event.code);
        return next;
      });
      keyDownAt.current.delete(event.code);
    };

    const blur = () => {
      setPressed(new Set());
      keyDownAt.current.clear();
    };

    area.addEventListener('keydown', down);
    area.addEventListener('keyup', up);
    area.addEventListener('blur', blur);
    window.addEventListener('blur', blur);
    return () => {
      area.removeEventListener('keydown', down);
      area.removeEventListener('keyup', up);
      area.removeEventListener('blur', blur);
      window.removeEventListener('blur', blur);
    };
  }, [active]);

  useEffect(() => {
    if (!active || pressed.size === 0) return;
    const timer = window.setInterval(() => setClock((value) => value + 1), 500);
    return () => window.clearInterval(timer);
  }, [active, pressed.size]);

  const possibleHeld = useMemo(
    () => [...pressed].filter((code) => performance.now() - (keyDownAt.current.get(code) ?? performance.now()) > 2500),
    [pressed, clock],
  );
  const mappedTested = [...tested].filter((code) => rows.some((row) => row.includes(code))).length;
  const reservedTested = [...tested].filter((code) => potentiallyReserved.has(code)).length;
  const reset = () => {
    setPressed(new Set()); setTested(new Set()); setHistory([]); setRepeatCount(0); keyDownAt.current.clear();
  };
  const start = () => {
    setActive(true);
    window.setTimeout(() => areaRef.current?.focus(), 0);
  };
  const exit = () => {
    setActive(false); setPressed(new Set()); keyDownAt.current.clear();
  };

  return (
    <div className="tool-shell" aria-labelledby="keyboard-tool-title">
      <div className="tool-shell__header"><div><strong id="keyboard-tool-title">Bounded keyboard test area</strong><div className="help-text">Key events are used only while this area is active. Do not type passwords or sensitive information.</div></div><span>{active ? 'Test active' : 'Test inactive'}</span></div>
      <div className="tool-shell__body">
        <div ref={areaRef} className={`test-surface keyboard-surface ${active ? 'active' : ''}`} tabIndex={0} role="region" aria-label="Keyboard test area. Press Start Keyboard Test, then press keys. Tab remains available for normal navigation and Escape exits the test.">
          {!active ? (
            <div className="test-placeholder"><div><Keyboard size={42} /><h2>Press keys safely inside this area</h2><p>While active, the test prevents ordinary browser actions for Space, arrows, navigation keys, and F1–F12 where the browser allows it. Tab remains available and Escape exits.</p><button className="btn btn-primary" type="button" onClick={start}>Start Keyboard Test</button></div></div>
          ) : (
            <div className="scroll-box"><div className="keyboard-map" aria-hidden="true">{rows.map((row, index) => <div className="keyboard-row" key={index}>{row.map((code) => <div key={code} className={`key ${wideKeys.has(code) ? 'wide' : ''} ${potentiallyReserved.has(code) ? 'reserved' : ''} ${pressed.has(code) ? 'pressed' : ''} ${tested.has(code) && !pressed.has(code) ? 'tested' : ''}`}>{display(code)}</div>)}</div>)}</div></div>
          )}
        </div>
        <div className="button-row" style={{ marginTop: '1rem' }}><button className="btn btn-primary" type="button" onClick={start}>{active ? 'Refocus Keyboard Test' : 'Start Keyboard Test'}</button><button className="btn btn-secondary" type="button" onClick={exit}><LogOut size={18} />Exit Keyboard Test</button><button className="btn btn-secondary" type="button" onClick={reset}><RotateCcw size={18} />Reset Results</button></div>
        <dl className="metric-list"><div className="metric"><dt>Mapped keys tested</dt><dd>{mappedTested}</dd></div><div className="metric"><dt>Keys currently held</dt><dd>{pressed.size}</dd></div><div className="metric"><dt>Repeat events observed</dt><dd>{repeatCount}</dd></div><div className="metric"><dt>Reserved-key events received</dt><dd>{reservedTested}</dd></div></dl>
        {tested.size > 0 && <ResultState tone="success" label="Key events received" announce={false}><p>The active browser area received events from {tested.size} unique key code{tested.size === 1 ? '' : 's'}. Function and navigation keys are prevented from performing their normal page action where the browser permits it.</p></ResultState>}
        <ResultState tone="info" label="Some system shortcuts cannot be guaranteed"><p>F5, F11, Print Screen, the Windows or Command key, media keys, power keys, and modifier shortcuts may be intercepted before the page receives them. A missing event does not prove that the physical key is broken.</p></ResultState>
        {possibleHeld.length > 0 && <ResultState tone="warning" label="Possible held key"><p>{possibleHeld.join(', ')} remained pressed for an extended period. Release the key, click outside the area, or reset the test.</p></ResultState>}
        {repeatCount > 4 && <ResultState tone="warning" label="Rapid repeated input observed"><p>Repeated keydown events were received. Holding a key normally produces repeats, so compare the behavior after releasing it.</p></ResultState>}
        <h3>Recent key history</h3><ol>{history.length ? history.map((item, index) => <li key={`${item}-${index}`}><code>{item}</code></li>) : <li>No key events recorded in this session.</li>}</ol>
      </div>
      <div className="tool-shell__footer"><p className="help-text">The visual map covers common full-size keyboard keys. Regional, media, specialist, and firmware-level behavior can differ.</p></div>
    </div>
  );
}
