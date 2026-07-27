import { CircleHelp, Headphones, Play, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ResultState } from './ResultState';

type Sample = 'left' | 'right' | 'stereo' | 'tone' | 'speech';
type Confirmation = 'heard' | 'partial' | 'none' | 'unsure' | null;

export default function SpeakerTest() {
  const [playing, setPlaying] = useState<Sample | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [playbackError, setPlaybackError] = useState('');
  const contextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioScheduledSourceNode[]>([]);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = () => {
    nodesRef.current.forEach((node) => { try { node.stop(); } catch { /* already stopped */ } });
    nodesRef.current = [];
    window.speechSynthesis?.cancel();
    setPlaying(null);
  };

  const ensureContext = async () => {
    if (!('AudioContext' in window)) throw new Error('Web Audio unavailable');
    const context = contextRef.current ?? new AudioContext();
    contextRef.current = context;
    if (context.state === 'suspended') await context.resume();
    return context;
  };

  const playTone = async (sample: Sample, pan: number, duration = 0.85, frequency = 440) => {
    stop(); setPlaying(sample); setConfirmation(null); setPlaybackError('');
    try {
      const context = await ensureContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const panner = context.createStereoPanner();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency; panner.pan.value = pan;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
      oscillator.connect(gain).connect(panner).connect(context.destination);
      oscillator.start(); oscillator.stop(context.currentTime + duration + 0.05);
      nodesRef.current = [oscillator];
      oscillator.addEventListener('ended', () => setPlaying(null), { once: true });
    } catch { setPlaying(null); setPlaybackError('This browser could not start the generated speaker tone. Try a current browser or use the operating system sound settings.'); }
  };

  const play = async (sample: Sample) => {
    setPlaying(sample); setConfirmation(null);
    if (sample === 'left') return playTone(sample, -1, 0.9, 440);
    if (sample === 'right') return playTone(sample, 1, 0.9, 520);
    if (sample === 'tone') return playTone(sample, 0, 1.1, 600);
    if (sample === 'stereo') {
      stop(); setPlaying(sample); setPlaybackError('');
      try {
        const context = await ensureContext();
        const schedule = (pan: number, start: number, frequency: number) => {
          const oscillator = context.createOscillator(); const gain = context.createGain(); const panner = context.createStereoPanner();
          oscillator.frequency.value = frequency; panner.pan.value = pan;
          gain.gain.setValueAtTime(0.0001, start); gain.gain.exponentialRampToValueAtTime(0.07, start + 0.03); gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
          oscillator.connect(gain).connect(panner).connect(context.destination); oscillator.start(start); oscillator.stop(start + 0.6); nodesRef.current.push(oscillator);
        };
        schedule(-1, context.currentTime, 440); schedule(1, context.currentTime + 0.7, 520);
        window.setTimeout(() => setPlaying(null), 1500);
      } catch {
        setPlaying(null);
        setPlaybackError('This browser could not start the stereo sequence. Try a current browser or check the operating system output device.');
      }
      return;
    }
    stop(); setPlaying(sample); setPlaybackError('');
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('This is a local browser speaker test.');
      utterance.volume = 0.65; utterance.rate = 0.95; utterance.onend = () => setPlaying(null); utterance.onerror = () => setPlaying(null);
      speechRef.current = utterance; window.speechSynthesis.speak(utterance);
    } else { setPlaying(null); setPlaybackError('Browser speech playback is unavailable. Use a generated tone instead.'); }
  };

  useEffect(() => () => { stop(); void contextRef.current?.close(); }, []);

  return <div className="tool-shell" aria-labelledby="speaker-tool-title">
    <div className="tool-shell__header"><div><strong id="speaker-tool-title">Speaker and headphone playback</strong><div className="help-text">This test plays audio only. It never uses your microphone.</div></div><span>{playing ? 'Sound playing' : 'Sound stopped'}</span></div>
    <div className="tool-shell__body">
      <ResultState tone="info" label="Use a low, comfortable volume"><p>Start at a low system volume. Stop immediately if a sound is uncomfortable. This is a basic playback check, not acoustic calibration or hearing advice.</p></ResultState>
      <div className="card-grid" style={{ marginTop: '1rem' }}>
        <button className="tool-card" type="button" onClick={() => void play('left')}><Headphones size={28} /><strong>Play left channel</strong><span className="help-text">A short 440 Hz tone should favor the left side.</span></button>
        <button className="tool-card" type="button" onClick={() => void play('right')}><Headphones size={28} /><strong>Play right channel</strong><span className="help-text">A short 520 Hz tone should favor the right side.</span></button>
        <button className="tool-card" type="button" onClick={() => void play('stereo')}><Play size={28} /><strong>Play stereo sequence</strong><span className="help-text">Left, then right.</span></button>
        <button className="tool-card" type="button" onClick={() => void play('speech')}><Play size={28} /><strong>Play speech sample</strong><span className="help-text">Uses the browser speech feature when available.</span></button>
        <button className="tool-card" type="button" onClick={() => void play('tone')}><Play size={28} /><strong>Play centered tone</strong><span className="help-text">A short conservative-volume tone.</span></button>
        <button className="tool-card" type="button" onClick={stop}><Square size={28} /><strong>Stop Sound</strong><span className="help-text">Stops tones and browser speech immediately.</span></button>
      </div>
      {playbackError && <ResultState tone="warning" label="Playback could not start"><p>{playbackError}</p></ResultState>}
      <h3>What did you hear?</h3>
      <div className="button-row" role="group" aria-label="Speaker result confirmation">
        <button className="btn btn-secondary" type="button" onClick={() => setConfirmation('heard')}>I heard the expected sound</button>
        <button className="btn btn-secondary" type="button" onClick={() => setConfirmation('partial')}>Only one side or part</button>
        <button className="btn btn-secondary" type="button" onClick={() => setConfirmation('none')}>I heard nothing</button>
        <button className="btn btn-secondary" type="button" onClick={() => setConfirmation('unsure')}><CircleHelp size={18} />Not sure</button>
      </div>
      {confirmation === 'heard' && <ResultState tone="success" label="Playback confirmed"><p>You confirmed that you heard the expected sound. The browser cannot verify speaker output automatically.</p></ResultState>}
      {confirmation === 'partial' && <ResultState tone="warning" label="Channel or playback problem possible"><p>Check balance, cable connections, Bluetooth mode, mono-audio settings, and the selected operating-system output device.</p></ResultState>}
      {confirmation === 'none' && <ResultState tone="error" label="No sound confirmed"><p>Check mute, volume, output selection, cable or Bluetooth routing, and whether another application controls the device.</p></ResultState>}
      {confirmation === 'unsure' && <ResultState tone="incomplete" label="Confirmation required"><p>Playback alone does not prove that the sound was audible. Try another output device or ask another person to confirm.</p></ResultState>}
    </div>
    <div className="tool-shell__footer"><div className="button-row"><button className="btn btn-primary" type="button" onClick={stop}><Square size={18} />Stop Sound</button><a className="btn btn-quiet" href="/device-check/">Run Complete Device Check</a></div></div>
  </div>;
}
