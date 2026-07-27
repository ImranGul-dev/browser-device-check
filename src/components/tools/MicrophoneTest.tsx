import { Mic, Play, RefreshCw, Square, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { mediaErrorMessage, stopStream, supportsSecureMedia } from '@/lib/media';
import { ResultState } from './ResultState';

type Phase = 'idle' | 'explain' | 'starting' | 'active' | 'stopped' | 'error' | 'unsupported';
type AudioFinding = 'waiting' | 'detected' | 'low' | 'quiet' | 'clipping' | 'background';

const SAMPLE_SECONDS = 3;
const UI_UPDATE_INTERVAL_MS = 100;

export default function MicrophoneTest() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [finding, setFinding] = useState<AudioFinding>('waiting');
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [sampleAvailable, setSampleAvailable] = useState(false);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  const [error, setError] = useState({ label: '', message: '' });

  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const playbackRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferedChunksRef = useRef<Float32Array[]>([]);
  const bufferedFramesRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampleCount = useRef(0);
  const activeCount = useRef(0);
  const clippingCount = useRef(0);
  const startedAt = useRef(0);
  const lastUiUpdate = useRef(0);
  const lastFindingUpdate = useRef(0);
  const latestPeak = useRef(0);

  const stopPlayback = useCallback(() => {
    try { playbackRef.current?.stop(); } catch { /* source already ended */ }
    playbackRef.current?.disconnect();
    playbackRef.current = null;
    playingRef.current = false;
    setPlaying(false);
  }, []);

  const clearTemporarySample = useCallback(() => {
    stopPlayback();
    bufferedChunksRef.current = [];
    bufferedFramesRef.current = 0;
    setSampleAvailable(false);
  }, [stopPlayback]);

  const stop = useCallback(
    (next: Phase = 'stopped') => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      clearTemporarySample();
      processorRef.current?.disconnect();
      processorRef.current = null;
      silentGainRef.current?.disconnect();
      silentGainRef.current = null;
      stopStream(streamRef.current);
      streamRef.current = null;
      void contextRef.current?.close();
      contextRef.current = null;
      analyserRef.current = null;
      setPhase(next);
    },
    [clearTemporarySample],
  );

  const draw = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let sumSquares = 0;
    let localPeak = 0;

    for (const value of data) {
      const normalized = (value - 128) / 128;
      sumSquares += normalized * normalized;
      localPeak = Math.max(localPeak, Math.abs(normalized));
    }

    const rms = Math.sqrt(sumSquares / data.length);
    const normalizedLevel = Math.min(1, rms * 4.5);
    latestPeak.current = Math.max(latestPeak.current * 0.98, localPeak);
    sampleCount.current += 1;
    if (rms > 0.025) activeCount.current += 1;
    if (localPeak > 0.97) clippingCount.current += 1;

    const now = performance.now();
    if (now - lastUiUpdate.current >= UI_UPDATE_INTERVAL_MS) {
      setLevel(normalizedLevel);
      setPeak(latestPeak.current);
      lastUiUpdate.current = now;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (
        canvas.width !== Math.round(width * ratio) ||
        canvas.height !== Math.round(height * ratio)
      ) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#0F766E';
      ctx.lineWidth = 2;
      ctx.beginPath();
      data.forEach((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = (value / 255) * height;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    const elapsed = now - startedAt.current;
    if (elapsed > 2500 && now - lastFindingUpdate.current >= 400) {
      const activityRatio = activeCount.current / Math.max(1, sampleCount.current);
      if (clippingCount.current > 4) setFinding('clipping');
      else if (activityRatio > 0.72 && normalizedLevel < 0.18) setFinding('background');
      else if (activityRatio > 0.2 && normalizedLevel < 0.12) setFinding('low');
      else if (activityRatio > 0.08) setFinding('detected');
      else if (elapsed > 5500) setFinding('quiet');
      lastFindingUpdate.current = now;
    }

    animationRef.current = requestAnimationFrame(draw);
  }, []);

  const start = useCallback(
    async (preferredId?: string) => {
      if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) {
        setPhase('unsupported');
        return;
      }
      if (!supportsSecureMedia()) {
        setError({
          label: 'Secure page required',
          message:
            'Open the HTTPS version of this page. Microphone access is normally unavailable on an insecure page.',
        });
        setPhase('error');
        return;
      }

      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      clearTemporarySample();
      processorRef.current?.disconnect();
      silentGainRef.current?.disconnect();
      stopStream(streamRef.current);
      await contextRef.current?.close().catch(() => undefined);

      setPhase('starting');
      setFinding('waiting');
      setPeak(0);
      setLevel(0);
      setError({ label: '', message: '' });
      sampleCount.current = 0;
      activeCount.current = 0;
      clippingCount.current = 0;
      latestPeak.current = 0;
      lastUiUpdate.current = 0;
      lastFindingUpdate.current = 0;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: preferredId
            ? {
                deviceId: { exact: preferredId },
                echoCancellation: true,
                noiseSuppression: true,
              }
            : { echoCancellation: true, noiseSuppression: true },
          video: false,
        });
        streamRef.current = stream;

        const context = new AudioContext();
        contextRef.current = context;
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.75;
        source.connect(analyser);
        analyserRef.current = analyser;

        // Keep only a short rolling PCM window in volatile memory for optional local playback.
        // It is never encoded, persisted, uploaded, or sent outside the current page.
        const processor = context.createScriptProcessor(2048, 1, 1);
        const silentGain = context.createGain();
        silentGain.gain.value = 0;
        processor.onaudioprocess = (event) => {
          if (playingRef.current) return;
          const input = event.inputBuffer.getChannelData(0);
          const chunk = new Float32Array(input);
          bufferedChunksRef.current.push(chunk);
          bufferedFramesRef.current += chunk.length;
          const maximumFrames = Math.round(context.sampleRate * SAMPLE_SECONDS);
          while (
            bufferedFramesRef.current > maximumFrames &&
            bufferedChunksRef.current.length > 1
          ) {
            const removed = bufferedChunksRef.current.shift();
            bufferedFramesRef.current -= removed?.length ?? 0;
          }
          if (bufferedFramesRef.current >= context.sampleRate / 2) setSampleAvailable(true);
        };
        source.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(context.destination);
        processorRef.current = processor;
        silentGainRef.current = silentGain;

        const track = stream.getAudioTracks()[0];
        if (track) {
          setDeviceId(track.getSettings().deviceId || preferredId || '');
          track.addEventListener('ended', () => stop('stopped'), { once: true });
        }
        const list = await navigator.mediaDevices.enumerateDevices().catch(() => [] as MediaDeviceInfo[]);
        setDevices(list.filter((device) => device.kind === 'audioinput'));
        startedAt.current = performance.now();
        setPhase('active');
        animationRef.current = requestAnimationFrame(draw);
      } catch (caught) {
        setError(mediaErrorMessage(caught, 'microphone'));
        setPhase('error');
        stopStream(streamRef.current);
      }
    },
    [clearTemporarySample, draw, stop],
  );

  const playLocalSample = useCallback(async () => {
    const context = contextRef.current;
    if (!context || bufferedFramesRef.current === 0) return;

    stopPlayback();
    if (context.state === 'suspended') await context.resume();

    const frames = bufferedFramesRef.current;
    const chunks = bufferedChunksRef.current;
    bufferedChunksRef.current = [];
    bufferedFramesRef.current = 0;
    setSampleAvailable(false);
    const buffer = context.createBuffer(1, frames, context.sampleRate);
    const channel = buffer.getChannelData(0);
    let offset = 0;
    for (const chunk of chunks) {
      channel.set(chunk, offset);
      offset += chunk.length;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.onended = () => {
      source.disconnect();
      if (playbackRef.current === source) playbackRef.current = null;
      playingRef.current = false;
      setPlaying(false);
      // Discard the sample immediately after playback; a new rolling sample can form while active.
      bufferedChunksRef.current = [];
      bufferedFramesRef.current = 0;
      setSampleAvailable(false);
    };
    playbackRef.current = source;
    playingRef.current = true;
    setPlaying(true);
    source.start();
  }, [stopPlayback]);

  useEffect(() => {
    if (phase !== 'active') return undefined;
    const onVisibilityChange = () => {
      if (document.hidden) stop('stopped');
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [phase, stop]);

  useEffect(
    () => () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      playbackRef.current?.stop();
      processorRef.current?.disconnect();
      silentGainRef.current?.disconnect();
      stopStream(streamRef.current);
      void contextRef.current?.close();
    },
    [],
  );

  const findingView = () => {
    if (finding === 'detected')
      return (
        <ResultState tone="success" label="Microphone activity detected">
          <p>
            The browser received changing input while you spoke. This confirms browser input during
            this session, not professional audio quality.
          </p>
        </ResultState>
      );
    if (finding === 'low')
      return (
        <ResultState tone="warning" label="Input may be low">
          <p>
            Speak closer to the microphone, check the selected device, and raise the operating-system
            input level if appropriate.
          </p>
        </ResultState>
      );
    if (finding === 'clipping')
      return (
        <ResultState tone="warning" label="Possible clipping">
          <p>
            The digital signal repeatedly approached its upper range. Move farther away or reduce input
            gain.
          </p>
        </ResultState>
      );
    if (finding === 'background')
      return (
        <ResultState tone="warning" label="Possible background activity">
          <p>
            The browser received continuing low-level activity. This test cannot identify the source
            reliably.
          </p>
        </ResultState>
      );
    if (finding === 'quiet')
      return (
        <ResultState tone="incomplete" label="Little or no input detected">
          <p>
            Check mute controls, input selection, operating-system permissions, and cable or Bluetooth
            routing, then try again.
          </p>
        </ResultState>
      );
    return (
      <ResultState tone="info" label="Speak in a normal voice">
        <p>
          The test is building a relative activity summary. Audio stays in this page and is not uploaded
          or saved.
        </p>
      </ResultState>
    );
  };

  return (
    <div className="tool-shell" aria-labelledby="microphone-tool-title">
      <div className="tool-shell__header">
        <div>
          <strong id="microphone-tool-title">Browser-local microphone analysis</strong>
          <div className="help-text">
            Audio is analyzed locally. An optional sample is held briefly in memory and is never uploaded
            or saved.
          </div>
        </div>
        <span className="status-row">
          <span
            className={`status-dot ${phase === 'active' ? 'active' : ''}`}
            aria-hidden="true"
          />
          {phase === 'active' ? 'Microphone active' : 'Microphone inactive'}
        </span>
      </div>
      <div className="tool-shell__body">
        {phase === 'idle' && (
          <div className="test-placeholder">
            <div>
              <Mic size={42} />
              <h2>Ready to test your microphone</h2>
              <p>The browser will not request access until you select Allow Microphone.</p>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setPhase('explain')}
              >
                Start Microphone Test
              </button>
            </div>
          </div>
        )}
        {phase === 'explain' && (
          <ResultState tone="permission" label="Microphone permission needed">
            <p>
              The browser will ask to use a microphone so this page can calculate a local waveform,
              relative level, and short optional playback sample. Nothing is sent to a server.
            </p>
            <div className="button-row">
              <button className="btn btn-primary" type="button" onClick={() => void start()}>
                <Mic size={18} />
                Allow Microphone
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setPhase('idle')}>
                Cancel
              </button>
            </div>
          </ResultState>
        )}
        {phase === 'starting' && (
          <div className="test-placeholder">
            <p role="status">Waiting for your browser’s microphone decision…</p>
          </div>
        )}
        {phase === 'unsupported' && (
          <ResultState tone="info" label="Microphone test unavailable">
            <p>
              This browser does not expose the media or Web Audio feature required for the complete
              test.
            </p>
          </ResultState>
        )}
        {phase === 'error' && (
          <ResultState tone="error" label={error.label}>
            <p>{error.message}</p>
          </ResultState>
        )}
        {phase === 'stopped' && (
          <ResultState
            tone={finding === 'detected' ? 'success' : 'incomplete'}
            label="Microphone test stopped"
          >
            <p>
              The microphone track, temporary sample, and audio context were closed. No sample was
              uploaded or saved.
            </p>
          </ResultState>
        )}
        {phase === 'active' && (
          <>
            <canvas
              ref={canvasRef}
              className="waveform"
              aria-label="Live microphone waveform. A text result is provided below."
            />
            <div className="field">
              <span className="field-label">Relative input level</span>
              <div
                className="level-meter"
                role="meter"
                aria-label="Relative microphone input level"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(level * 100)}
              >
                <div
                  className="level-meter__fill"
                  style={{ width: `${Math.round(level * 100)}%` }}
                />
              </div>
              <span className="help-text">
                Peak observed: {Math.round(peak * 100)}%. These are relative browser values, not
                calibrated decibels.
              </span>
            </div>
            {devices.length > 1 && (
              <div className="field">
                <label htmlFor="microphone-select">Choose another microphone</label>
                <select
                  id="microphone-select"
                  value={deviceId}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => void start(event.target.value)}
                >
                  {devices.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="field">
              <span className="field-label">Optional local playback</span>
              <p className="help-text">
                Play up to the latest {SAMPLE_SECONDS} seconds at a comfortable volume. The temporary
                sample is discarded after playback or when the test stops.
              </p>
              <div className="button-row">
                <button
                  className="btn btn-secondary"
                  type="button"
                  disabled={!sampleAvailable || playing}
                  onClick={() => void playLocalSample()}
                >
                  <Play size={18} />
                  Play Local Sample
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  disabled={!playing}
                  onClick={stopPlayback}
                >
                  <VolumeX size={18} />
                  Stop Playback
                </button>
                <button
                  className="btn btn-quiet"
                  type="button"
                  disabled={!sampleAvailable && !playing}
                  onClick={clearTemporarySample}
                >
                  Discard Sample
                </button>
              </div>
            </div>
            {findingView()}
          </>
        )}
      </div>
      <div className="tool-shell__footer">
        <div className="button-row">
          {phase === 'active' && (
            <button className="btn btn-primary" type="button" onClick={() => stop()}>
              <Square size={18} />
              Stop Microphone
            </button>
          )}
          {['stopped', 'error', 'unsupported'].includes(phase) && (
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setPhase('explain')}
            >
              <RefreshCw size={18} />
              Try Microphone Again
            </button>
          )}
          <a className="btn btn-quiet" href="/device-check/">
            Run Complete Device Check
          </a>
        </div>
      </div>
    </div>
  );
}
