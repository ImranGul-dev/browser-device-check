import { Gamepad2, Play, Square, Vibrate } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ResultState } from './ResultState';

type Snapshot = {
  index: number;
  id: string;
  mapping: string;
  connected: boolean;
  buttons: { pressed: boolean; value: number }[];
  axes: number[];
  haptics: boolean;
};

function snapshot(gamepad: Gamepad): Snapshot {
  const extended = gamepad as Gamepad & { vibrationActuator?: { playEffect?: (type: string, options: Record<string, number>) => Promise<unknown> } };
  return {
    index: gamepad.index,
    id: gamepad.id || `Controller ${gamepad.index + 1}`,
    mapping: gamepad.mapping || 'unmapped',
    connected: gamepad.connected,
    buttons: gamepad.buttons.map((button) => ({ pressed: button.pressed, value: button.value })),
    axes: [...gamepad.axes],
    haptics: Boolean(extended.vibrationActuator?.playEffect),
  };
}

export default function GamepadTest() {
  const [running, setRunning] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [controllers, setControllers] = useState<Snapshot[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [inputObserved, setInputObserved] = useState(false);
  const [hapticMessage, setHapticMessage] = useState('');
  const animation = useRef<number | null>(null);
  const lastUpdate = useRef(0);

  useEffect(() => {
    setSupported('getGamepads' in navigator);
  }, []);

  useEffect(() => {
    if (!running || !('getGamepads' in navigator)) return;
    const poll = (time: number) => {
      const pads = Array.from(navigator.getGamepads?.() || []).filter((pad): pad is Gamepad => Boolean(pad));
      if (time - lastUpdate.current > 80) {
        const next = pads.map(snapshot);
        setControllers(next);
        setSelectedIndex((current) => current !== null && next.some((pad) => pad.index === current) ? current : (next[0]?.index ?? null));
        if (pads.some((pad) => pad.buttons.some((button) => button.pressed || button.value > 0.1) || pad.axes.some((axis) => Math.abs(axis) > 0.18))) setInputObserved(true);
        lastUpdate.current = time;
      }
      animation.current = window.requestAnimationFrame(poll);
    };
    animation.current = window.requestAnimationFrame(poll);
    return () => { if (animation.current !== null) window.cancelAnimationFrame(animation.current); };
  }, [running]);

  const stop = () => {
    setRunning(false);
    if (animation.current !== null) window.cancelAnimationFrame(animation.current);
    animation.current = null;
  };

  const vibrate = async () => {
    const gamepad = Array.from(navigator.getGamepads?.() || []).find((pad) => pad?.index === selectedIndex) as (Gamepad & { vibrationActuator?: { playEffect?: (type: string, options: Record<string, number>) => Promise<unknown> } }) | undefined;
    const actuator = gamepad?.vibrationActuator;
    if (!actuator?.playEffect) { setHapticMessage('Haptic feedback is not exposed for this controller and browser.'); return; }
    try {
      await actuator.playEffect('dual-rumble', { duration: 250, startDelay: 0, strongMagnitude: 0.45, weakMagnitude: 0.35 });
      setHapticMessage('A short vibration request was sent. Confirm whether you felt it.');
    } catch {
      setHapticMessage('The browser could not start haptic feedback.');
    }
  };

  const selected = controllers.find((controller) => controller.index === selectedIndex) || null;
  return (
    <div className="tool-shell" aria-labelledby="gamepad-tool-title">
      <div className="tool-shell__header"><div><strong id="gamepad-tool-title">Local controller input test</strong><div className="help-text">Press a controller button after starting so the browser can expose the device.</div></div><span>{running ? 'Test active' : 'Test inactive'}</span></div>
      <div className="tool-shell__body">
        {!running ? <div className="test-placeholder"><div><Gamepad2 size={42} /><h2>Test gamepad buttons, sticks, triggers, and axes</h2><p>Connect a controller, select Start, then press a button or move a stick. Some browsers reveal controllers only after interaction.</p><button className="btn btn-primary" type="button" onClick={() => { setInputObserved(false); setHapticMessage(''); setRunning(true); }} disabled={supported !== true}><Play size={18} />Start Controller Test</button></div></div> : (
          <>
            <div className="button-row"><button className="btn btn-secondary" type="button" onClick={stop}><Square size={18} />Stop Controller Test</button></div>
            {controllers.length > 1 && <div className="field"><label htmlFor="controller-select">Controller</label><select id="controller-select" value={selectedIndex ?? ''} onChange={(event: ChangeEvent<HTMLSelectElement>) => setSelectedIndex(Number(event.target.value))}>{controllers.map((controller) => <option key={controller.index} value={controller.index}>{controller.id}</option>)}</select></div>}
            {!selected && <ResultState tone="info" label="Waiting for controller input"><p>Press a button or move a stick on a connected controller. Check the cable, Bluetooth connection, battery, and browser focus if it does not appear.</p></ResultState>}
            {selected && <>
              <dl className="metric-list"><div className="metric"><dt>Controller</dt><dd>{selected.id}</dd></div><div className="metric"><dt>Mapping</dt><dd>{selected.mapping}</dd></div><div className="metric"><dt>Buttons / axes</dt><dd>{selected.buttons.length} / {selected.axes.length}</dd></div></dl>
              <h3>Buttons</h3>
              <div className="gamepad-buttons" aria-label="Controller button states">{selected.buttons.map((button, index) => <div className={`gamepad-button ${button.pressed || button.value > 0.1 ? 'active' : ''}`} key={index}><strong>{index}</strong><span>{button.value.toFixed(2)}</span></div>)}</div>
              <h3>Axes</h3>
              <div className="axis-list">{selected.axes.map((axis, index) => <div className="axis-row" key={index}><span>Axis {index}</span><div className="axis-track"><span className="axis-center" /><span className="axis-value" style={{ left: `${((axis + 1) / 2) * 100}%` }} /></div><code>{axis.toFixed(3)}</code></div>)}</div>
              {selected.haptics && <div className="button-row"><button className="btn btn-secondary" type="button" onClick={() => void vibrate()}><Vibrate size={18} />Test Short Vibration</button></div>}
              {hapticMessage && <p role="status">{hapticMessage}</p>}
            </>}
            {inputObserved && <ResultState tone="success" label="Controller input received" announce={false}><p>The browser received at least one button or axis change during this session.</p></ResultState>}
          </>
        )}
        {supported === false && <ResultState tone="incomplete" label="Gamepad API unavailable"><p>This browser does not expose the Gamepad API required for the controller test.</p></ResultState>}
      </div>
      <div className="tool-shell__footer"><p className="help-text">Controller identifiers and inputs stay in this browser session and are not uploaded or stored by this tool. Mapping and haptic support vary by platform.</p></div>
    </div>
  );
}
