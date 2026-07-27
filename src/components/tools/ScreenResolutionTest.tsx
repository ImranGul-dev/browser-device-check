import { Monitor, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ResultState } from './ResultState';

type DisplayReport = {
  screenSize: string;
  availableSize: string;
  viewportSize: string;
  visualViewportSize: string;
  devicePixelRatio: string;
  renderingEstimate: string;
  orientation: string;
  colorDepth: string;
};

function readReport(): DisplayReport {
  const dpr = window.devicePixelRatio || 1;
  const visual = window.visualViewport;
  const orientation = window.screen.orientation?.type ||
    (window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape');

  return {
    screenSize: `${window.screen.width} × ${window.screen.height} CSS pixels`,
    availableSize: `${window.screen.availWidth} × ${window.screen.availHeight} CSS pixels`,
    viewportSize: `${window.innerWidth} × ${window.innerHeight} CSS pixels`,
    visualViewportSize: visual
      ? `${Math.round(visual.width)} × ${Math.round(visual.height)} CSS pixels`
      : 'Not exposed by this browser',
    devicePixelRatio: dpr.toFixed(2),
    renderingEstimate: `${Math.round(window.screen.width * dpr)} × ${Math.round(window.screen.height * dpr)} pixels`,
    orientation,
    colorDepth: `${window.screen.colorDepth}-bit`,
  };
}

export default function ScreenResolutionTest() {
  const [report, setReport] = useState<DisplayReport | null>(null);
  const [active, setActive] = useState(false);

  const measure = useCallback(() => {
    setReport(readReport());
    setActive(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    const update = () => setReport(readReport());
    window.addEventListener('resize', update);
    window.screen.orientation?.addEventListener('change', update);
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      window.screen.orientation?.removeEventListener('change', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, [active]);

  return (
    <div className="tool-shell" aria-labelledby="resolution-tool-title">
      <div className="tool-shell__header">
        <div>
          <strong id="resolution-tool-title">Browser-reported display information</strong>
          <div className="help-text">The values are read locally and update when the window or display scale changes.</div>
        </div>
        <span>{active ? 'Live report' : 'Ready'}</span>
      </div>
      <div className="tool-shell__body">
        {!report ? (
          <div className="test-placeholder">
            <div>
              <Monitor size={42} />
              <h2>Check screen, viewport, and pixel-density values</h2>
              <p>The browser can report CSS dimensions and a device-pixel ratio, but it cannot reliably prove the panel’s exact physical resolution.</p>
              <button className="btn btn-primary" type="button" onClick={measure}>Check My Display</button>
            </div>
          </div>
        ) : (
          <>
            <dl className="metric-list metric-list--wide">
              <div className="metric"><dt>Screen-reported size</dt><dd>{report.screenSize}</dd></div>
              <div className="metric"><dt>Available screen area</dt><dd>{report.availableSize}</dd></div>
              <div className="metric"><dt>Browser viewport</dt><dd>{report.viewportSize}</dd></div>
              <div className="metric"><dt>Visual viewport</dt><dd>{report.visualViewportSize}</dd></div>
              <div className="metric"><dt>Device pixel ratio</dt><dd>{report.devicePixelRatio}</dd></div>
              <div className="metric"><dt>Rendering-pixel estimate</dt><dd>{report.renderingEstimate}</dd></div>
              <div className="metric"><dt>Orientation</dt><dd>{report.orientation}</dd></div>
              <div className="metric"><dt>Color depth</dt><dd>{report.colorDepth}</dd></div>
            </dl>
            <div className="button-row">
              <button className="btn btn-secondary" type="button" onClick={measure}><RefreshCw size={18} />Refresh Measurements</button>
            </div>
            <ResultState tone="success" label="Display information received">
              <p>The browser exposed current screen and viewport values. These are useful for layout and troubleshooting, but scaling and zoom can change how they relate to physical pixels.</p>
            </ResultState>
            <ResultState tone="info" label="Why the rendering estimate is not a hardware resolution">
              <p>The estimate multiplies the screen-reported CSS size by the current device pixel ratio. Browser zoom, operating-system scaling, remote desktops, virtual displays, and browser privacy behavior can affect it.</p>
            </ResultState>
          </>
        )}
      </div>
      <div className="tool-shell__footer"><p className="help-text">No display information is uploaded or stored by this tool.</p></div>
    </div>
  );
}
