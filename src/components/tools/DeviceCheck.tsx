import { Camera, Check, ChevronLeft, ChevronRight, CircleHelp, Mic, MonitorUp, Play, Square, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { mediaErrorMessage, stopStream } from '@/lib/media';
import { ResultState, type ResultTone } from './ResultState';

type Status = 'pending' | 'passed' | 'warning' | 'failed' | 'skipped';
type StepKey = 'browser' | 'camera' | 'microphone' | 'speaker' | 'permissions' | 'screen' | 'review';
interface CheckResult { status: Status; title: string; detail: string; }
const steps: { key: StepKey; label: string }[] = [
  { key: 'browser', label: 'Browser and display' }, { key: 'camera', label: 'Camera' }, { key: 'microphone', label: 'Microphone' },
  { key: 'speaker', label: 'Speakers' }, { key: 'permissions', label: 'Permissions' }, { key: 'screen', label: 'Screen sharing' }, { key: 'review', label: 'Review' },
];

export default function DeviceCheck() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<Partial<Record<StepKey, CheckResult>>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [speakerPlaying, setSpeakerPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStream = useRef<MediaStream | null>(null);
  const micStream = useRef<MediaStream | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const operationId = useRef(0);
  const step = steps[current] ?? steps[0]!;

  const setResult = (key: StepKey, result: CheckResult) => setResults((value) => ({ ...value, [key]: result }));
  const cleanup = () => {
    operationId.current += 1;
    stopStream(cameraStream.current);
    stopStream(micStream.current);
    cameraStream.current = null;
    micStream.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    void audioContext.current?.close();
    audioContext.current = null;
    setSpeakerPlaying(false);
  };
  useEffect(() => () => {
    stopStream(cameraStream.current);
    stopStream(micStream.current);
    void audioContext.current?.close();
  }, []);

  const next = () => { cleanup(); setBusy(false); setMessage(''); setCurrent((value) => Math.min(steps.length - 1, value + 1)); };
  const back = () => { cleanup(); setBusy(false); setMessage(''); setCurrent((value) => Math.max(0, value - 1)); };
  const skip = () => { setResult(step.key, { status: 'skipped', title: `${step.label} not completed`, detail: 'This step was skipped or could not be confirmed.' }); next(); };
  const stopAll = () => { cleanup(); setStarted(false); setCurrent(0); setResults({}); setBusy(false); setMessage(''); };

  const runBrowser = () => {
    const secure = window.isSecureContext || ['localhost', '127.0.0.1'].includes(location.hostname);
    const features = { camera: Boolean(navigator.mediaDevices?.getUserMedia), screen: Boolean(navigator.mediaDevices?.getDisplayMedia), fullscreen: Boolean(document.documentElement.requestFullscreen), pointer: 'PointerEvent' in window };
    const missing = Object.entries(features).filter(([, value]) => !value).map(([key]) => key);
    setResult('browser', { status: secure && missing.length === 0 ? 'passed' : secure ? 'warning' : 'failed', title: secure && missing.length === 0 ? 'Core browser features available' : 'Some browser features are limited', detail: `${screen.width} × ${screen.height} screen, ${window.innerWidth} × ${window.innerHeight} viewport, ${navigator.hardwareConcurrency || 'unknown'} logical processors. ${secure ? 'Secure context available.' : 'HTTPS is required for media permissions.'}${missing.length ? ` Missing: ${missing.join(', ')}.` : ''}` });
    setMessage('Browser and display information checked locally.');
  };

  const runCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setResult('camera', { status: 'failed', title: 'Camera API unavailable', detail: 'This browser does not expose the media feature required for the camera check.' });
      return;
    }
    setBusy(true); setMessage('Waiting for the camera permission decision…');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); cameraStream.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setMessage('Camera stream received. Confirm whether the preview is visible and moving.');
    } catch (error) { const resolved = mediaErrorMessage(error, 'camera'); setResult('camera', { status: 'failed', title: resolved.label, detail: resolved.message }); setMessage(resolved.message); setBusy(false); }
  };
  const confirmCamera = (visible: boolean) => { setResult('camera', { status: visible ? 'passed' : 'warning', title: visible ? 'Live camera preview confirmed' : 'Camera preview not confirmed', detail: visible ? 'The browser received a camera stream and you confirmed a visible moving image.' : 'A stream may have started, but a usable live image was not confirmed.' }); setBusy(false); cleanup(); };

  const runMicrophone = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) {
      setResult('microphone', { status: 'failed', title: 'Microphone test unavailable', detail: 'This browser does not expose the media or Web Audio feature required for the microphone check.' });
      return;
    }
    const runId = operationId.current + 1;
    operationId.current = runId;
    setBusy(true); setMessage('Speak in a normal voice for about three seconds.');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (operationId.current !== runId) { stopStream(stream); return; }
      micStream.current = stream;
      const context = new AudioContext(); audioContext.current = context;
      const analyser = context.createAnalyser(); analyser.fftSize = 1024; context.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize); let maximum = 0; const started = performance.now();
      await new Promise<void>((resolve) => {
        const sample = () => {
          if (operationId.current !== runId || context.state === 'closed') { resolve(); return; }
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (const value of data) { const normalized = (value - 128) / 128; sum += normalized * normalized; }
          maximum = Math.max(maximum, Math.sqrt(sum / data.length));
          if (performance.now() - started < 3200) requestAnimationFrame(sample); else resolve();
        };
        sample();
      });
      if (operationId.current !== runId) return;
      const status: Status = maximum > 0.035 ? 'passed' : maximum > 0.012 ? 'warning' : 'failed';
      setResult('microphone', { status, title: status === 'passed' ? 'Microphone activity detected' : status === 'warning' ? 'Microphone input appears low' : 'Little or no microphone input', detail: `Maximum relative activity was ${Math.round(maximum * 1000) / 10}%. This is a browser-relative value, not calibrated decibels.` });
      setMessage('Microphone analysis finished. No audio was uploaded or saved.');
    } catch (error) {
      if (operationId.current !== runId) return;
      const resolved = mediaErrorMessage(error, 'microphone');
      setResult('microphone', { status: 'failed', title: resolved.label, detail: resolved.message });
      setMessage(resolved.message);
    } finally {
      if (operationId.current === runId) { setBusy(false); cleanup(); }
    }
  };

  const playSpeaker = async () => {
    cleanup();
    if (!window.AudioContext) {
      setResult('speaker', { status: 'warning', title: 'Speaker playback unavailable', detail: 'This browser does not expose the Web Audio feature required for the tone check.' });
      return;
    }
    setSpeakerPlaying(true);
    try {
      const context = new AudioContext();
      audioContext.current = context;
      await context.resume();
      const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.frequency.value = 520;
      gain.gain.setValueAtTime(0.0001, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.03); gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.8);
      oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.85); oscillator.onended = () => setSpeakerPlaying(false);
    } catch {
      setSpeakerPlaying(false);
      setResult('speaker', { status: 'warning', title: 'Speaker sound could not start', detail: 'Check browser audio restrictions, output settings, and volume, then try again.' });
    }
  };
  const confirmSpeaker = (heard: boolean | null) => { setResult('speaker', { status: heard === true ? 'passed' : heard === false ? 'failed' : 'skipped', title: heard === true ? 'Speaker sound confirmed' : heard === false ? 'No speaker sound confirmed' : 'Speaker check incomplete', detail: heard === true ? 'You confirmed that the browser tone was audible.' : heard === false ? 'Check volume, mute, output selection, cable, and Bluetooth routing.' : 'The browser cannot verify sound without user confirmation.' }); cleanup(); };

  const runPermissions = async () => {
    const details: string[] = [];
    const query = async (name: PermissionName) => { try { const status = await navigator.permissions.query({ name }); details.push(`${name}: ${status.state}`); return status.state; } catch { details.push(`${name}: browser does not expose a reliable pre-request state`); return 'unknown'; } };
    const camera = await query('camera' as PermissionName); const microphone = await query('microphone' as PermissionName);
    const failed = camera === 'denied' || microphone === 'denied';
    setResult('permissions', { status: failed ? 'warning' : 'passed', title: failed ? 'One or more permissions are blocked' : 'Permission status reviewed', detail: details.join('. ') }); setMessage(details.join('. '));
  };

  const runScreen = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) { setResult('screen', { status: 'warning', title: 'Screen Capture API unavailable', detail: 'This browser does not expose the screen-sharing chooser to this page.' }); return; }
    setBusy(true); setMessage('The browser will open its screen-sharing chooser. Select a source or cancel. The selected content is not previewed, recorded, or uploaded.');
    try { const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }); const track = stream.getVideoTracks()[0]; const label = track?.label || 'A screen source'; stopStream(stream); setResult('screen', { status: 'passed', title: 'Screen-sharing chooser completed', detail: `${label} was selected. The track was stopped immediately without recording or upload.` }); setMessage('Screen-sharing track stopped immediately.'); }
    catch (error) { const name = error instanceof DOMException ? error.name : ''; setResult('screen', { status: name === 'NotAllowedError' ? 'skipped' : 'warning', title: name === 'NotAllowedError' ? 'Screen sharing not selected' : 'Screen-sharing check could not complete', detail: name === 'NotAllowedError' ? 'The chooser was canceled or permission was not granted. This is not automatically a failure.' : 'Try again in a current browser and confirm that organization policy allows screen sharing.' }); setMessage('No screen-sharing content was retained.'); }
    finally { setBusy(false); }
  };

  const finalCategory = useMemo(() => {
    const entries = Object.entries(results).filter(([key]) => key !== 'review').map(([, value]) => value as CheckResult);
    if (entries.length < 6 || entries.some((value) => value.status === 'skipped' || value.status === 'pending')) return { title: 'Check incomplete', tone: 'incomplete' as ResultTone, detail: 'One or more readiness steps were skipped or not confirmed.' };
    if (entries.some((value) => value.status === 'failed')) return { title: 'Not ready', tone: 'error' as ResultTone, detail: 'At least one important step failed or was not usable.' };
    if (entries.some((value) => value.status === 'warning')) return { title: 'Ready with warnings', tone: 'warning' as ResultTone, detail: 'Core checks completed, but one or more items should be reviewed before the call.' };
    return { title: 'Ready', tone: 'success' as ResultTone, detail: 'All guided steps were completed without a warning in this browser session.' };
  }, [results]);

  if (!started) return <div className="tool-shell"><div className="tool-shell__body"><div className="test-placeholder"><div><Check size={42} /><h2>Run a guided device readiness check</h2><p>Camera, microphone, speaker, permission, screen-sharing, browser, and display checks run locally. No account or upload is required.</p><button className="btn btn-primary" type="button" onClick={() => { setResults({}); setCurrent(0); setStarted(true); }}>Run Complete Device Check</button></div></div></div></div>;

  return <div className="tool-shell" aria-labelledby="device-check-title">
    <div className="tool-shell__header"><div><strong id="device-check-title">Complete Device Check</strong><div className="help-text">Step {current + 1} of {steps.length}: {step.label}</div></div><button className="btn btn-secondary" type="button" onClick={stopAll}><X size={18} />End Check</button></div>
    <div className="tool-shell__body">
      <ol className="check-steps" aria-label="Device check progress">{steps.map((item, index) => { const status = results[item.key]?.status; return <li key={item.key} className={`check-step ${index === current ? 'current' : ''} ${status === 'passed' ? 'complete' : ''}`}><span className="step-number">{status === 'passed' ? '✓' : index + 1}</span><div><strong>{item.label}</strong><div className="help-text">{results[item.key]?.title || (index === current ? 'Current step' : 'Not completed')}</div></div></li>; })}</ol>
      <div style={{ marginTop: '1.5rem' }}>
        {step.key === 'browser' && <><h2>Check browser and display information</h2><p>This step reads browser-exposed feature support, viewport size, screen size, and secure-context status. It does not upload the information.</p><button className="btn btn-primary" type="button" onClick={runBrowser}>Check Browser</button></>}
        {step.key === 'camera' && <><h2>Check the camera</h2><p>Camera access is requested only after you select Allow Camera. Video remains in this browser.</p><div className="button-row"><button className="btn btn-primary" type="button" disabled={busy} onClick={() => void runCamera()}><Camera size={18} />Allow Camera</button>{cameraStream.current && <><button className="btn btn-secondary" type="button" onClick={() => confirmCamera(true)}>Image is visible and moving</button><button className="btn btn-secondary" type="button" onClick={() => confirmCamera(false)}>No or not sure</button></>}</div><video ref={videoRef} className="camera-preview" playsInline muted aria-label="Local camera preview for Device Check" hidden={!cameraStream.current} /></>}
        {step.key === 'microphone' && <><h2>Check the microphone</h2><p>After permission, speak normally for about three seconds. Audio is analyzed locally and not recorded.</p><button className="btn btn-primary" type="button" disabled={busy} onClick={() => void runMicrophone()}><Mic size={18} />Allow Microphone and Check</button></>}
        {step.key === 'speaker' && <><h2>Check the speaker or headphones</h2><p>Play a short conservative-volume tone, then confirm what you heard. The page does not use your microphone.</p><div className="button-row"><button className="btn btn-primary" type="button" disabled={speakerPlaying} onClick={() => void playSpeaker()}><Play size={18} />{speakerPlaying ? 'Tone Playing' : 'Play Speaker Tone'}</button>{speakerPlaying && <button className="btn btn-secondary" type="button" onClick={cleanup}><Square size={18} />Stop Sound</button>}<button className="btn btn-secondary" type="button" onClick={() => confirmSpeaker(true)}>I heard it</button><button className="btn btn-secondary" type="button" onClick={() => confirmSpeaker(false)}>I heard nothing</button><button className="btn btn-secondary" type="button" onClick={() => confirmSpeaker(null)}><CircleHelp size={18} />Not sure</button></div></>}
        {step.key === 'permissions' && <><h2>Review browser permission states</h2><p>Some browsers expose camera and microphone status before a request; others do not. The actual prompt remains authoritative.</p><button className="btn btn-primary" type="button" onClick={() => void runPermissions()}>Check Permission Status</button></>}
        {step.key === 'screen' && <><h2>Check screen-sharing availability</h2><p>The browser’s chooser opens only after the button. If you select a source, its track is stopped immediately without preview, recording, storage, or upload.</p><button className="btn btn-primary" type="button" disabled={busy} onClick={() => void runScreen()}><MonitorUp size={18} />Open Sharing Chooser</button></>}
        {step.key === 'review' && <><h2>Your readiness result</h2><ResultState tone={finalCategory.tone} label={finalCategory.title}><p>{finalCategory.detail}</p></ResultState><div className="prose"><h3>Step results</h3><ul>{steps.filter((item) => item.key !== 'review').map((item) => <li key={item.key}><strong>{item.label}:</strong> {results[item.key]?.title || 'Not completed'} - {results[item.key]?.detail || 'Run or skip this step.'}</li>)}</ul><p>This result summarizes browser-observed evidence and your confirmations. It is not certification and does not guarantee that Zoom, Microsoft Teams, Google Meet, exam software, telehealth software, or another application will select the same devices or permissions.</p></div></>}
      </div>
      {message && <p className="notice notice-info notice-plain" role="status">{message}</p>}
      {results[step.key] && step.key !== 'review' && <ResultState tone={results[step.key]?.status === 'passed' ? 'success' : results[step.key]?.status === 'failed' ? 'error' : results[step.key]?.status === 'warning' ? 'warning' : 'incomplete'} label={results[step.key]?.title || 'Result'}><p>{results[step.key]?.detail}</p></ResultState>}
    </div>
    <div className="tool-shell__footer"><div className="button-row"><button className="btn btn-secondary" type="button" onClick={back} disabled={current === 0}><ChevronLeft size={18} />Back</button>{step.key !== 'review' && <button className="btn btn-secondary" type="button" onClick={skip}>Skip Step</button>}<button className="btn btn-primary" type="button" onClick={next} disabled={current === steps.length - 1}>{current === steps.length - 2 ? 'View Results' : 'Next'} <ChevronRight size={18} /></button><button className="btn btn-quiet" type="button" onClick={stopAll}><Square size={18} />Stop Check</button></div></div>
  </div>;
}
