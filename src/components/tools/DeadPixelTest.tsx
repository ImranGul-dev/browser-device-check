import { ChevronLeft, ChevronRight, Maximize2, Pause, Play, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ResultState } from './ResultState';

type Observation = 'clear' | 'spot' | 'line' | 'uneven' | 'unsure' | null;
const screens = [
  { name: 'Black', purpose: 'Look for bright, colored, or glowing points.', style: { background: '#000000' } },
  { name: 'OLED near-black', purpose: 'Look for near-black unevenness or persistent bright areas.', style: { background: '#080808' } },
  { name: 'White', purpose: 'Look for dark points, marks, discoloration, or shadows.', style: { background: '#ffffff' } },
  { name: 'Red', purpose: 'Look for points that remain dark or show the wrong color.', style: { background: '#ff0000' } },
  { name: 'Green', purpose: 'Look for points that remain dark or show the wrong color.', style: { background: '#00ff00' } },
  { name: 'Blue', purpose: 'Look for points that remain dark or show the wrong color.', style: { background: '#0000ff' } },
  { name: 'Mid gray', purpose: 'Look for uneven brightness, tint, lines, or image retention.', style: { background: '#808080' } },
  { name: 'Dark gray', purpose: 'Look for dark-scene uniformity problems and vertical bands.', style: { background: '#202020' } },
  { name: 'Horizontal gradient', purpose: 'Look for abrupt bands, clipping, or uneven transitions.', style: { background: 'linear-gradient(90deg, #000, #fff)' } },
  { name: 'Vertical gradient', purpose: 'Look for abrupt bands, clipping, or uneven transitions.', style: { background: 'linear-gradient(180deg, #000, #fff)' } },
  { name: 'Fine checkerboard', purpose: 'Look for scaling, sharpness, and repeating-pattern issues.', style: { backgroundColor: '#fff', backgroundImage: 'linear-gradient(45deg,#000 25%,transparent 25%),linear-gradient(-45deg,#000 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#000 75%),linear-gradient(-45deg,transparent 75%,#000 75%)', backgroundSize: '16px 16px', backgroundPosition: '0 0,0 8px,8px -8px,-8px 0' } },
  { name: 'Moving band', purpose: 'Look for obvious tearing, trails, flicker, or persistent marks. Pause if uncomfortable.', style: { background: 'repeating-linear-gradient(90deg,#111 0 80px,#eee 80px 160px)' } },
] as const;

export default function DeadPixelTest() {
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [interrupted, setInterrupted] = useState(false);
  const [observation, setObservation] = useState<Observation>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const exitButtonRef = useRef<HTMLButtonElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const firstObservationRef = useRef<HTMLButtonElement>(null);
  const current = screens[index] ?? screens[0]!;
  const isMoving = current.name === 'Moving band';
  const isLast = index === screens.length - 1;
  const style = useMemo(() => ({ ...current.style, ...(isMoving && !paused ? { animation: 'pixel-pan 8s linear infinite' } : {}) }), [current, isMoving, paused]);

  const previous = () => setIndex((value) => Math.max(0, value - 1));
  const leaveFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
    setActive(false);
  };
  const exitEarly = async () => {
    setInterrupted(true);
    await leaveFullscreen();
    requestAnimationFrame(() => startButtonRef.current?.focus());
  };
  const finish = async () => {
    setCompleted(true);
    setInterrupted(false);
    await leaveFullscreen();
    window.setTimeout(() => {
      firstObservationRef.current?.focus();
      firstObservationRef.current?.scrollIntoView({ block: 'center' });
    }, 50);
  };
  const next = () => {
    if (isLast) void finish();
    else setIndex((value) => Math.min(screens.length - 1, value + 1));
  };
  const begin = async () => {
    setObservation(null);
    setCompleted(false);
    setInterrupted(false);
    setPaused(false);
    setIndex(0);
    setActive(true);
    if (shellRef.current?.requestFullscreen) await shellRef.current.requestFullscreen().catch(() => undefined);
  };

  useEffect(() => {
    if (active) requestAnimationFrame(() => exitButtonRef.current?.focus());
  }, [active]);

  useEffect(() => {
    const fullscreenChange = () => {
      if (active && !document.fullscreenElement) {
        setActive(false);
        if (!completed) setInterrupted(true);
        requestAnimationFrame(() => startButtonRef.current?.focus());
      }
    };
    document.addEventListener('fullscreenchange', fullscreenChange);
    return () => document.removeEventListener('fullscreenchange', fullscreenChange);
  }, [active, completed]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!active) return;
      const target = event.target as HTMLElement | null;
      if (event.key === 'Tab') {
        const controls = Array.from(toolbarRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
        if (controls.length > 0) {
          const first = controls[0]!;
          const last = controls[controls.length - 1]!;
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
        return;
      }
      if (event.key === 'ArrowRight' || (event.key === ' ' && !target?.closest('button'))) { event.preventDefault(); next(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); previous(); }
      if (event.key === 'Escape') void exitEarly();
      if (event.key.toLowerCase() === 'p' && !target?.closest('button')) setPaused((value) => !value);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [active, isLast]);

  return (
    <div ref={shellRef} className="tool-shell" aria-labelledby="pixel-tool-title">
      <style>{`@keyframes pixel-pan { from { background-position: 0 0; } to { background-position: 320px 0; } }`}</style>
      <div className="tool-shell__header"><div><strong id="pixel-tool-title">User-controlled screen inspection</strong><div className="help-text">No screenshot or image of your display is captured.</div></div><span>Visual check only</span></div>
      <div className="tool-shell__body">
        <div className="test-placeholder"><div><Maximize2 size={42} /><h2>Inspect your display with solid colors and patterns</h2><p>This is a manual inspection. Each screen makes a different kind of dot, line, mark, or uneven area easier to notice. A result form appears after the final screen.</p><button ref={startButtonRef} className="btn btn-primary" type="button" onClick={() => void begin()}>{completed ? 'Run Screen Inspection Again' : 'Start Screen Inspection'}</button></div></div>
        <ResultState tone="info" label="The browser cannot see a dead pixel"><p>You perform the inspection. The test only displays controlled colors and patterns; it does not capture or analyze your screen.</p></ResultState>
        {interrupted && !completed && <ResultState tone="warning" label="Inspection not completed"><p>You left before the final screen. Restart to review all twelve screens, or continue with a partial visual judgment outside the tool.</p></ResultState>}
        {completed && (
          <section className="inspection-result" aria-labelledby="inspection-result-heading">
            <h3 id="inspection-result-heading">Record your inspection result</h3>
            <p>Select the option that best matches what you observed across all twelve screens.</p>
            <div className="button-row" role="group" aria-label="Screen inspection observation">
              <button ref={firstObservationRef} className="btn btn-secondary" type="button" onClick={() => setObservation('clear')}>No suspicious area</button>
              <button className="btn btn-secondary" type="button" onClick={() => setObservation('spot')}>A fixed dot or spot</button>
              <button className="btn btn-secondary" type="button" onClick={() => setObservation('line')}>A line</button>
              <button className="btn btn-secondary" type="button" onClick={() => setObservation('uneven')}>Uneven brightness or color</button>
              <button className="btn btn-secondary" type="button" onClick={() => setObservation('unsure')}>Not sure</button>
            </div>
          </section>
        )}
        {observation === 'clear' && <ResultState tone="success" label="No suspicious area reported"><p>You did not report a visible issue during this inspection. Intermittent, angle-dependent, or very small problems may still need another check.</p></ResultState>}
        {observation === 'spot' && <ResultState tone="warning" label="Fixed dot or spot reported"><p>Clean the display, compare the same location across black, white, red, green, and blue, and inspect the screen while powered off. A persistent mark may require manufacturer guidance or professional service.</p></ResultState>}
        {observation === 'line' && <ResultState tone="warning" label="Line reported"><p>Compare another cable, input, application, screenshot, and external display. A persistent line may involve the panel, connection, graphics path, or physical damage.</p></ResultState>}
        {observation === 'uneven' && <ResultState tone="warning" label="Uneven brightness or color reported"><p>Compare brightness settings, ambient light, viewing angle, neutral content, and another display. Some variation can be normal, while strong persistent areas may need support.</p></ResultState>}
        {observation === 'unsure' && <ResultState tone="info" label="Result not confirmed"><p>Clean the screen and run the inspection again in a dim, stable environment. Compare the suspicious location on multiple colors and from another viewing angle.</p></ResultState>}
      </div>
      {active && <div className="pixel-stage" role="dialog" aria-modal="true" aria-label="Full-screen display inspection">
        <div ref={toolbarRef} className="pixel-toolbar"><button ref={exitButtonRef} className="btn btn-secondary" type="button" onClick={() => void exitEarly()}><X size={18} />Exit Full Screen</button><button className="btn btn-secondary" type="button" onClick={previous} disabled={index === 0}><ChevronLeft size={18} />Previous</button><button className="btn btn-secondary" type="button" onClick={next}>{isLast ? 'Finish Inspection' : 'Next'} {!isLast && <ChevronRight size={18} />}</button>{isMoving && <button className="btn btn-secondary" type="button" onClick={() => setPaused((value) => !value)}>{paused ? <Play size={18} /> : <Pause size={18} />}{paused ? 'Resume Movement' : 'Pause Movement'}</button>}<strong>{index + 1} of {screens.length}: {current.name}</strong></div>
        <div className="pixel-canvas" style={style} role="img" aria-label={`${current.name} test screen`} />
        <div className="pixel-footer"><strong>{current.purpose}</strong> Use Left and Right Arrow or Space to change screens. On the last screen, select Finish Inspection to record a result.</div>
      </div>}
    </div>
  );
}
