import { Gauge, Play, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { estimateRefreshRate, type RefreshEstimate } from '@/lib/refresh-rate';
import { ResultState } from './ResultState';

type Status = 'idle' | 'running' | 'complete' | 'interrupted' | 'unsupported';
const TEST_DURATION = 3500;

export default function RefreshRateTest() {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<RefreshEstimate | null>(null);
  const frameId = useRef<number | null>(null);
  const timestamps = useRef<number[]>([]);
  const startedAt = useRef(0);

  const cancel = () => {
    if (frameId.current !== null) window.cancelAnimationFrame(frameId.current);
    frameId.current = null;
  };

  const stop = (nextStatus: Status = 'interrupted') => {
    cancel();
    setStatus(nextStatus);
  };

  const start = () => {
    if (!('requestAnimationFrame' in window)) {
      setStatus('unsupported');
      return;
    }
    cancel();
    timestamps.current = [];
    setResult(null);
    setProgress(0);
    setStatus('running');
    startedAt.current = performance.now();

    const sample = (time: number) => {
      if (document.hidden) {
        stop('interrupted');
        return;
      }
      timestamps.current.push(time);
      const elapsed = time - startedAt.current;
      setProgress(Math.min(100, Math.round((elapsed / TEST_DURATION) * 100)));
      if (elapsed >= TEST_DURATION) {
        frameId.current = null;
        setResult(estimateRefreshRate(timestamps.current));
        setStatus('complete');
        return;
      }
      frameId.current = window.requestAnimationFrame(sample);
    };
    frameId.current = window.requestAnimationFrame(sample);
  };

  useEffect(() => () => cancel(), []);

  return (
    <div className="tool-shell" aria-labelledby="refresh-tool-title">
      <div className="tool-shell__header">
        <div><strong id="refresh-tool-title">Browser refresh-rate estimator</strong><div className="help-text">Measures animation callback timing for about 3.5 seconds.</div></div>
        <span>{status === 'running' ? 'Test running' : status === 'complete' ? 'Estimate ready' : 'Ready'}</span>
      </div>
      <div className="tool-shell__body">
        <div className="test-placeholder refresh-stage">
          <div>
            <Gauge size={42} />
            <h2>{status === 'running' ? 'Keep this tab visible' : 'Estimate the browser-observed refresh rate'}</h2>
            <p>{status === 'running' ? 'Avoid switching tabs or moving the window while samples are collected.' : 'This test observes requestAnimationFrame timing. It does not read or certify the monitor hardware.'}</p>
            {status === 'running' && <div className="progress-track" role="progressbar" aria-label="Refresh-rate test progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>}
            <div className="button-row button-row--center">
              <button className="btn btn-primary" type="button" onClick={start} disabled={status === 'running'}><Play size={18} />{status === 'complete' ? 'Run Again' : 'Start Refresh Rate Test'}</button>
              {status === 'running' && <button className="btn btn-secondary" type="button" onClick={() => stop()}><Square size={18} />Stop Test</button>}
            </div>
          </div>
        </div>
        {status === 'complete' && result && (
          <>
            <dl className="metric-list">
              <div className="metric"><dt>Browser-observed estimate</dt><dd>Approximately {result.hz} Hz</dd></div>
              <div className="metric"><dt>Median frame interval</dt><dd>{result.medianInterval} ms</dd></div>
              <div className="metric"><dt>Timing variation</dt><dd>{result.jitter} ms median deviation</dd></div>
              <div className="metric"><dt>Long frame intervals</dt><dd>{result.longFrames} of {result.sampleCount}</dd></div>
            </dl>
            <ResultState tone={result.longFrames > result.sampleCount * 0.1 ? 'warning' : 'success'} label="Refresh-rate estimate completed">
              <p>The browser delivered animation frames at an estimated {result.hz} Hz during this short visible-tab sample. Background work, power saving, variable refresh, browser scheduling, and dropped frames can affect the number.</p>
            </ResultState>
          </>
        )}
        {status === 'complete' && !result && <ResultState tone="warning" label="Not enough stable samples"><p>The browser did not provide enough usable frame intervals. Keep the tab visible, close heavy applications, and try again.</p></ResultState>}
        {status === 'interrupted' && <ResultState tone="warning" label="Test interrupted"><p>The test stopped because the tab became hidden or Stop Test was selected. Keep the page visible and run it again.</p></ResultState>}
        {status === 'unsupported' && <ResultState tone="incomplete" label="Animation timing unavailable"><p>This browser does not expose the animation callback required for the estimator.</p></ResultState>}
      </div>
      <div className="tool-shell__footer"><p className="help-text">This result is a browser timing estimate, not an exact monitor specification or calibration result.</p></div>
    </div>
  );
}
