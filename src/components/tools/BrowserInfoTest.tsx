import { Globe, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { ResultState } from './ResultState';

type Feature = { name: string; supported: boolean; note: string };
type Report = {
  browser: string;
  platform: string;
  language: string;
  secureContext: boolean;
  viewport: string;
  userAgent: string;
  features: Feature[];
};

function approximateBrowser(userAgent: string): string {
  const matches: Array<[RegExp, string]> = [
    [/Edg\/(\d+(?:\.\d+)?)/, 'Microsoft Edge'],
    [/OPR\/(\d+(?:\.\d+)?)/, 'Opera'],
    [/Chrome\/(\d+(?:\.\d+)?)/, 'Google Chrome or Chromium'],
    [/Firefox\/(\d+(?:\.\d+)?)/, 'Mozilla Firefox'],
    [/Version\/(\d+(?:\.\d+)?).*Safari/, 'Apple Safari'],
  ];
  for (const [pattern, name] of matches) {
    const match = userAgent.match(pattern);
    if (match) return `${name} ${match[1]} (approximate)`;
  }
  return 'Browser name not reliably identified';
}

function collectReport(): Report {
  const media = navigator.mediaDevices;
  const audioContextSupported = 'AudioContext' in window || 'webkitAudioContext' in window;
  return {
    browser: approximateBrowser(navigator.userAgent),
    platform: (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.platform || 'Not exposed',
    language: navigator.language || 'Not exposed',
    secureContext: window.isSecureContext,
    viewport: `${window.innerWidth} Ã— ${window.innerHeight} CSS pixels`,
    userAgent: navigator.userAgent,
    features: [
      { name: 'Camera and microphone access', supported: Boolean(media?.getUserMedia), note: 'MediaDevices.getUserMedia' },
      { name: 'Screen-sharing chooser', supported: Boolean(media?.getDisplayMedia), note: 'MediaDevices.getDisplayMedia' },
      { name: 'Fullscreen', supported: Boolean(document.documentElement.requestFullscreen), note: 'Fullscreen API' },
      { name: 'Pointer events', supported: 'PointerEvent' in window, note: 'Pointer Events' },
      { name: 'Touch input reported', supported: navigator.maxTouchPoints > 0, note: `${navigator.maxTouchPoints || 0} maximum touch points reported` },
      { name: 'Web Audio', supported: audioContextSupported, note: 'AudioContext' },
      { name: 'Gamepad access', supported: 'getGamepads' in navigator, note: 'Gamepad API' },
      { name: 'Visual viewport', supported: 'visualViewport' in window && Boolean(window.visualViewport), note: 'Visual Viewport API' },
    ],
  };
}

export default function BrowserInfoTest() {
  const [report, setReport] = useState<Report | null>(null);
  const check = () => setReport(collectReport());

  return (
    <div className="tool-shell" aria-labelledby="browser-tool-title">
      <div className="tool-shell__header"><div><strong id="browser-tool-title">Browser and feature-support report</strong><div className="help-text">The report is generated locally from values exposed to this page.</div></div><span>{report ? 'Report ready' : 'Ready'}</span></div>
      <div className="tool-shell__body">
        {!report ? (
          <div className="test-placeholder"><div><Globe size={42} /><h2>Check browser capabilities used by device tests</h2><p>Review secure-context status, viewport information, and whether important browser APIs are available.</p><button className="btn btn-primary" type="button" onClick={check}>Check Browser Information</button></div></div>
        ) : (
          <>
            <dl className="metric-list">
              <div className="metric"><dt>Browser</dt><dd>{report.browser}</dd></div>
              <div className="metric"><dt>Platform reported</dt><dd>{report.platform}</dd></div>
              <div className="metric"><dt>Language</dt><dd>{report.language}</dd></div>
              <div className="metric"><dt>Secure context</dt><dd>{report.secureContext ? 'Yes' : 'No'}</dd></div>
              <div className="metric"><dt>Current viewport</dt><dd>{report.viewport}</dd></div>
            </dl>
            <h3>Device-test feature support</h3>
            <div className="support-list" role="list">
              {report.features.map((feature) => <div className="support-row" role="listitem" key={feature.name}><span className={`support-badge ${feature.supported ? 'supported' : 'unsupported'}`}>{feature.supported ? 'Available' : 'Unavailable'}</span><div><strong>{feature.name}</strong><div className="help-text">{feature.note}</div></div></div>)}
            </div>
            <details className="technical-details"><summary>Technical user-agent string</summary><code>{report.userAgent}</code></details>
            <div className="button-row"><button className="btn btn-secondary" type="button" onClick={check}><RefreshCw size={18} />Refresh Report</button></div>
            <ResultState tone={report.secureContext ? 'success' : 'warning'} label={report.secureContext ? 'Browser report completed' : 'Secure page required for some tools'}><p>{report.secureContext ? 'The page is running in a secure context. Individual permissions still depend on browser and operating-system settings.' : 'Camera, microphone, and screen-sharing features usually require HTTPS or localhost. Open the secure production URL before judging availability.'}</p></ResultState>
          </>
        )}
      </div>
      <div className="tool-shell__footer"><p className="help-text">Browser identification is approximate. Feature detection is more dependable than relying only on a user-agent name.</p></div>
    </div>
  );
}

