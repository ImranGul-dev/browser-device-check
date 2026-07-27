import { Camera, Check, RefreshCw, Square, VideoOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { mediaErrorMessage, stopStream, supportsSecureMedia } from '@/lib/media';
import { ResultState } from './ResultState';

type Phase = 'idle' | 'explain' | 'starting' | 'active' | 'stopped' | 'error' | 'unsupported';

export default function WebcamTest() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [settings, setSettings] = useState<MediaTrackSettings>({});
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [brightness, setBrightness] = useState<'usable' | 'dark' | 'bright' | null>(null);
  const [imageActivity, setImageActivity] = useState<'waiting' | 'moving' | 'still'>('waiting');
  const [error, setError] = useState({ label: '', message: '' });
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameTimerRef = useRef<number | null>(null);
  const previousFrameRef = useRef<Uint8ClampedArray | null>(null);
  const frameAnalysisStartedRef = useRef(0);

  const stop = useCallback((next: Phase = 'stopped') => {
    if (frameTimerRef.current !== null) window.clearInterval(frameTimerRef.current);
    frameTimerRef.current = null;
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setPhase(next);
  }, []);

  const updateDevices = async () => {
    const list = await navigator.mediaDevices.enumerateDevices();
    setDevices(list.filter((device) => device.kind === 'videoinput'));
  };

  const start = useCallback(async (preferredId?: string) => {
    if (!navigator.mediaDevices?.getUserMedia) { setPhase('unsupported'); return; }
    if (!supportsSecureMedia()) { setError({ label: 'Secure page required', message: 'Open the HTTPS version of this page. Camera access is normally unavailable on an insecure page.' }); setPhase('error'); return; }
    if (frameTimerRef.current !== null) window.clearInterval(frameTimerRef.current);
    frameTimerRef.current = null;
    stopStream(streamRef.current);
    setPhase('starting'); setConfirmed(null); setBrightness(null); setImageActivity('waiting'); setError({ label: '', message: '' });
    previousFrameRef.current = null;
    frameAnalysisStartedRef.current = 0;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: preferredId ? { deviceId: { exact: preferredId } } : true, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error('Preview unavailable');
      video.srcObject = stream;
      await video.play();
      frameAnalysisStartedRef.current = performance.now();
      const track = stream.getVideoTracks()[0];
      if (track) {
        setSettings(track.getSettings());
        setDeviceId(track.getSettings().deviceId || preferredId || '');
        track.addEventListener('ended', () => stop('stopped'), { once: true });
      }
      await updateDevices().catch(() => setDevices([]));
      setPhase('active');
      frameTimerRef.current = window.setInterval(() => {
        const current = videoRef.current;
        if (!current || current.videoWidth === 0) return;
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 18;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;
        context.drawImage(current, 0, 0, 32, 18);
        const pixels = context.getImageData(0, 0, 32, 18).data;
        let sum = 0;
        let difference = 0;
        const previous = previousFrameRef.current;
        for (let i = 0; i < pixels.length; i += 4) {
          const luminance = ((pixels[i] ?? 0) + (pixels[i + 1] ?? 0) + (pixels[i + 2] ?? 0)) / 3;
          sum += luminance;
          if (previous) {
            const previousLuminance = ((previous[i] ?? 0) + (previous[i + 1] ?? 0) + (previous[i + 2] ?? 0)) / 3;
            difference += Math.abs(luminance - previousLuminance);
          }
        }
        const average = sum / (pixels.length / 4);
        const averageDifference = previous ? difference / (pixels.length / 4) : 0;
        previousFrameRef.current = new Uint8ClampedArray(pixels);
        setBrightness(average < 35 ? 'dark' : average > 225 ? 'bright' : 'usable');
        if (averageDifference > 3.5) setImageActivity('moving');
        else if (performance.now() - frameAnalysisStartedRef.current > 6000) {
          setImageActivity((current) => current === 'moving' ? current : 'still');
        }
      }, 1400);
    } catch (caught) {
      setError(mediaErrorMessage(caught, 'camera')); setPhase('error'); stopStream(streamRef.current); streamRef.current = null;
    }
  }, [stop]);

  useEffect(
    () => () => {
      if (frameTimerRef.current !== null) window.clearInterval(frameTimerRef.current);
      stopStream(streamRef.current);
      if (videoRef.current) videoRef.current.srcObject = null;
    },
    [],
  );

  useEffect(() => {
    if (phase !== 'active') return;
    const onVisibilityChange = () => { if (document.hidden) stop('stopped'); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [phase, stop]);

  const changeDevice = async (id: string) => { setDeviceId(id); await start(id); };

  return (
    <div className="tool-shell" aria-labelledby="webcam-tool-title">
      <div className="tool-shell__header"><div><strong id="webcam-tool-title">Local camera preview</strong><div className="help-text">No video is uploaded, recorded, or stored by this test.</div></div><span className="status-row"><span className={`status-dot ${phase === 'active' ? 'active' : ''}`} aria-hidden="true" />{phase === 'active' ? 'Camera active' : 'Camera inactive'}</span></div>
      <div className="tool-shell__body">
        {phase === 'idle' && <div className="test-placeholder"><div><Camera size={42} aria-hidden="true" /><h2>Ready to test your camera</h2><p>Select Start Webcam Test. The browser will not request access until you select Allow Camera.</p><button className="btn btn-primary" type="button" onClick={() => setPhase('explain')}>Start Webcam Test</button></div></div>}
        {phase === 'explain' && <ResultState tone="permission" label="Camera permission needed"><p>The browser will ask to use a camera for a local live preview. The page requests video only, not microphone access.</p><div className="button-row"><button className="btn btn-primary" type="button" onClick={() => void start()}><Camera size={18} />Allow Camera</button><button className="btn btn-secondary" type="button" onClick={() => setPhase('idle')}>Cancel</button></div></ResultState>}
        {phase === 'starting' && <div className="test-placeholder"><div><Camera size={42} aria-hidden="true" /><p role="status">Waiting for your browser’s camera decision and starting the local preview…</p></div></div>}
        <video ref={videoRef} className="camera-preview" playsInline muted aria-label="Local camera preview" hidden={phase !== 'active'} />
        {phase === 'unsupported' && <ResultState tone="info" label="Camera API unavailable"><p>This browser does not expose the media feature required for the complete webcam test. Try a current browser on a device with a camera.</p></ResultState>}
        {phase === 'error' && <ResultState tone="error" label={error.label}><p>{error.message}</p><button className="btn btn-secondary" type="button" onClick={() => setPhase('explain')}><RefreshCw size={18} />Try Camera Again</button></ResultState>}
        {phase === 'stopped' && <ResultState tone={confirmed ? 'success' : 'incomplete'} label={confirmed ? 'Live preview confirmed' : 'Camera test stopped'}><p>{confirmed ? 'The browser received a camera stream and you confirmed that the image was visible and moving.' : 'The camera stream is no longer active. No recording was saved.'}</p></ResultState>}
        {phase === 'active' && <>
          <div className="status-row"><strong>Can you see a live image that changes when you move?</strong><button className="btn btn-secondary" type="button" onClick={() => setConfirmed(true)}><Check size={18} />Yes, image is live</button><button className="btn btn-secondary" type="button" onClick={() => setConfirmed(false)}><VideoOff size={18} />No or not sure</button></div>
          {devices.length > 1 && <div className="field"><label htmlFor="camera-select">Choose another camera</label><select id="camera-select" value={deviceId} onChange={(event: ChangeEvent<HTMLSelectElement>) => void changeDevice(event.target.value)}>{devices.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>)}</select></div>}
          <dl className="metric-list"><div className="metric"><dt>Delivered size</dt><dd>{settings.width && settings.height ? `${settings.width} × ${settings.height}` : 'Not exposed'}</dd></div><div className="metric"><dt>Aspect ratio</dt><dd>{settings.aspectRatio ? settings.aspectRatio.toFixed(2) : 'Not exposed'}</dd></div><div className="metric"><dt>Frame rate</dt><dd>{settings.frameRate ? `${Math.round(settings.frameRate)} fps` : 'Not exposed'}</dd></div></dl>
          {brightness === 'dark' && <ResultState tone="warning" label="Image may be too dark"><p>Move a light in front of you, face a window, or increase room lighting. This is an approximate local observation.</p></ResultState>}
          {brightness === 'bright' && <ResultState tone="warning" label="Image may be very bright"><p>Reduce direct light or move away from a bright window. This is an approximate local observation.</p></ResultState>}
          {brightness === 'usable' && <ResultState tone="success" label="Lighting appears usable"><p>The preview contains a reasonable range of visible detail for a basic call. This is not calibrated image analysis.</p></ResultState>}
          {imageActivity === 'moving' && <ResultState tone="success" label="Image activity observed"><p>The local frame sample changed after the preview started. You must still confirm that the image is visible and moving as expected.</p></ResultState>}
          {imageActivity === 'still' && confirmed !== true && <ResultState tone="warning" label="Preview may be still or frozen"><p>Move clearly in front of the camera. If the preview does not change, close other camera applications, stop the test, and try again.</p></ResultState>}
        </>}
      </div>
      <div className="tool-shell__footer"><div className="button-row">{phase === 'active' && <button className="btn btn-primary" type="button" onClick={() => stop()}><Square size={18} />Stop Camera</button>}{['stopped','error','unsupported'].includes(phase) && <button className="btn btn-secondary" type="button" onClick={() => setPhase('explain')}><RefreshCw size={18} />Try Camera Again</button>}<a className="btn btn-quiet" href="/device-check/">Run Complete Device Check</a></div></div>
    </div>
  );
}
