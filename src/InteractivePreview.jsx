import { useEffect, useRef, useState } from 'react';
import { Gauge, Pause, Play, RotateCcw, ScanLine, Sparkles } from 'lucide-react';
import './preview.css';

const DEFAULT_SETTINGS = { outline: true, glow: true, rainbow: false, speed: 1, paused: false };
const BODY = [
  { x: -30, y: -155, width: 60, height: 60, seed: 17 },
  { x: -51, y: -91, width: 102, height: 111, seed: 28 },
  { x: -90, y: -88, width: 34, height: 113, seed: 41 },
  { x: 56, y: -88, width: 34, height: 113, seed: 62 },
  { x: -49, y: 25, width: 45, height: 120, seed: 79 },
  { x: 4, y: 25, width: 45, height: 120, seed: 97 },
];

function random(seed) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function drawDummy(canvas, context, width, height, phase, settings) {
  context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#090b0c';
  context.fillRect(0, 0, width, height);
  const scale = Math.max(0.05, Math.min(1.24, (height - 112) / 330, (width - 64) / 222));
  const centerX = width / 2;
  const centerY = height / 2 + 8;
  const hue = (phase * 30 + 180) % 360;
  const color = settings.rainbow ? `hsl(${hue} 70% 77%)` : '#eef3f1';

  context.save();
  context.translate(centerX, centerY);
  context.scale(scale, scale);
  for (const part of BODY) {
    context.fillStyle = '#14191b';
    context.fillRect(part.x, part.y, part.width, part.height);
    context.strokeStyle = '#424d51';
    context.lineWidth = 1;
    context.strokeRect(part.x, part.y, part.width, part.height);
    context.save();
    context.beginPath();
    context.rect(part.x + 2, part.y + 2, part.width - 4, part.height - 4);
    context.clip();
    context.strokeStyle = color;
    context.lineWidth = 0.9;
    context.globalAlpha = 0.55;
    context.shadowColor = color;
    context.shadowBlur = settings.glow ? 7 : 0;
    for (let crack = 0; crack < 6; crack += 1) {
      const seed = part.seed + crack * 13;
      context.beginPath();
      context.moveTo(part.x + random(seed) * part.width, part.y);
      for (let step = 0; step < 6; step += 1) {
        context.lineTo(part.x + random(seed + step * 19) * part.width, part.y + (step + 1) * part.height / 6);
      }
      context.stroke();
    }
    const band = ((phase * 55 + part.seed) % 400) - 190;
    context.globalAlpha = 0.15;
    context.fillStyle = color;
    context.fillRect(part.x, band, part.width, 12);
    context.globalAlpha = 0.65;
    context.fillRect(part.x, band + 5, part.width, 1);
    context.restore();
    if (settings.outline) {
      context.save();
      context.strokeStyle = color;
      context.lineWidth = 1.3;
      context.shadowColor = color;
      context.shadowBlur = settings.glow ? 10 : 0;
      context.strokeRect(part.x, part.y, part.width, part.height);
      context.restore();
    }
  }
  if (settings.outline) {
    context.strokeStyle = color;
    context.lineWidth = 1;
    context.globalAlpha = 0.65;
    const corners = [[-100, -165, 1, 1], [100, -165, -1, 1], [-100, 155, 1, -1], [100, 155, -1, -1]];
    for (const [x, y, dx, dy] of corners) {
      context.beginPath();
      context.moveTo(x, y + 20 * dy);
      context.lineTo(x, y);
      context.lineTo(x + 20 * dx, y);
      context.stroke();
    }
  }
  context.restore();
  context.strokeStyle = '#30383c';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(centerX - 40, height - 44);
  context.lineTo(centerX + 40, height - 44);
  context.stroke();
}

function PreviewSwitch({ id, label, checked, onChange }) {
  return (
    <label className="preview-lab__switch" htmlFor={id}>
      <span>{label}</span>
      <span className="preview-lab__switch-control">
        <input id={id} type="checkbox" role="switch" checked={checked} onChange={onChange} />
        <span className="preview-lab__switch-track" aria-hidden="true" />
      </span>
    </label>
  );
}

export default function InteractivePreview() {
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS }));
  const [resetToken, setResetToken] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [canvasUnavailable, setCanvasUnavailable] = useState(false);
  const canvasRef = useRef(null);
  const settingsRef = useRef(settings);
  const synchronizeRef = useRef(null);
  const previousResetRef = useRef(resetToken);
  settingsRef.current = settings;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      setCanvasUnavailable(true);
      return undefined;
    }
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false;
    let visible = false;
    let frame = 0;
    let previousAt = null;
    let phase = 0;
    let width = 1;
    let height = 1;
    const draw = () => drawDummy(canvas, context, width, height, phase, settingsRef.current);
    const shouldAnimate = () => !disposed && visible && !document.hidden && !media.matches
      && !settingsRef.current.paused && settingsRef.current.speed > 0;
    const stop = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      previousAt = null;
    };
    const tick = (at) => {
      frame = 0;
      if (!shouldAnimate()) {
        previousAt = null;
        return;
      }
      if (previousAt !== null) phase += Math.min(0.05, Math.max(0, (at - previousAt) / 1000)) * settingsRef.current.speed;
      previousAt = at;
      draw();
      frame = window.requestAnimationFrame(tick);
    };
    const synchronize = (reset = false) => {
      if (disposed) return;
      stop();
      if (reset) phase = 0;
      draw();
      if (shouldAnimate()) frame = window.requestAnimationFrame(tick);
    };
    synchronizeRef.current = synchronize;
    const resize = () => {
      if (disposed) return;
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      synchronize();
    };
    const onMotionChange = () => {
      setReducedMotion(media.matches);
      synchronize();
    };
    const onVisibilityChange = () => synchronize();
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    const intersectionObserver = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        synchronize();
      }, { threshold: 0.01 }) : null;
    resizeObserver?.observe(canvas);
    intersectionObserver?.observe(canvas);
    if (!intersectionObserver) visible = true;
    media.addEventListener('change', onMotionChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('resize', resize);
    setReducedMotion(media.matches);
    resize();
    return () => {
      disposed = true;
      stop();
      synchronizeRef.current = null;
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      media.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const reset = resetToken !== previousResetRef.current;
    previousResetRef.current = resetToken;
    synchronizeRef.current?.(reset);
  }, [settings, resetToken]);

  const change = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  const reset = () => {
    setSettings({ ...DEFAULT_SETTINGS });
    setResetToken((token) => token + 1);
  };
  const status = canvasUnavailable ? 'UNAVAILABLE' : settings.paused ? 'PAUSED'
    : reducedMotion ? 'REDUCED MOTION' : settings.speed === 0 ? 'STATIC' : 'RUNNING';

  return (
    <section id="playground" className="preview-lab" aria-labelledby="playground-title">
      <div className="preview-lab__container">
        <header className="preview-lab__header">
          <div>
            <span className="preview-lab__eyebrow">05 / EFFECT LAB</span>
            <h2 id="playground-title">Try the effects.</h2>
          </div>
          <p>A local visual demo. No Roblox connection or game input.</p>
        </header>
        <div className="preview-lab__workspace">
          <div className="preview-lab__controls">
            <div className="preview-lab__controls-heading">
              <Sparkles size={18} aria-hidden="true" />
              <h3>Visuals</h3>
              <span>DEMO</span>
            </div>
            <div className="preview-lab__switches">
              <PreviewSwitch id="preview-outline" label="Outline" checked={settings.outline}
                onChange={(event) => change('outline', event.target.checked)} />
              <PreviewSwitch id="preview-glow" label="Glow" checked={settings.glow}
                onChange={(event) => change('glow', event.target.checked)} />
              <PreviewSwitch id="preview-rainbow" label="Rainbow" checked={settings.rainbow}
                onChange={(event) => change('rainbow', event.target.checked)} />
            </div>
            <div className="preview-lab__speed">
              <div className="preview-lab__speed-label">
                <label htmlFor="preview-speed"><Gauge size={16} aria-hidden="true" />Speed</label>
                <output id="speed-value" htmlFor="preview-speed">{settings.speed.toFixed(2)}</output>
              </div>
              <input id="preview-speed" type="range" min="0" max="2" step="0.05" value={settings.speed}
                aria-label="Animation speed"
                style={{ '--preview-range-fill': `${settings.speed / 2 * 100}%` }}
                onChange={(event) => change('speed', Number(event.target.value))} />
              <div className="preview-lab__speed-scale" aria-hidden="true"><span>0</span><span>2x</span></div>
            </div>
            <div className="preview-lab__actions">
              <button id="pause-preview" type="button" className="preview-lab__pause" aria-pressed={settings.paused}
                title={settings.paused ? 'Resume preview' : 'Pause preview'}
                onClick={() => change('paused', !settings.paused)}>
                {settings.paused ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}
                <span>{settings.paused ? 'Resume' : 'Pause'}</span>
              </button>
              <button id="reset-preview" type="button" className="preview-lab__reset" aria-label="Reset preview"
                title="Reset preview" onClick={reset}>
                <RotateCcw size={17} aria-hidden="true" />
              </button>
            </div>
            <div className="preview-lab__local-label"><ScanLine size={15} aria-hidden="true" /><span>LOCAL RENDER</span></div>
          </div>
          <div className="preview-lab__stage">
            <div className="preview-lab__stage-meta"><span>BODY / 01</span><span id="preview-state" role="status" aria-live="polite">{status}</span></div>
            <canvas ref={canvasRef} id="demo-canvas" width="800" height="460" role="img"
              aria-label="Local two-dimensional six-part dummy with configurable electric effects">
              Two-dimensional body effect preview.
            </canvas>
            {canvasUnavailable && <p className="preview-lab__unavailable">Canvas preview is unavailable in this browser.</p>}
            <div className="preview-lab__stage-footer"><span>2D DUMMY</span><span>CLIENT-SIDE</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
