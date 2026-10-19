'use client';

import { useEffect, useRef } from 'react';

const BLOB_COUNT = 8;
const MAX_GLASS = 8;

export interface LiquidGlass {
  /** Corner radius in px; anything over half the short side becomes a pill. */
  radius: number;
  /** Width of the curved rim, in px, where the liquid underneath bends. */
  bezel: number;
  /** How far, in px, the rim pulls the image inward at the very edge. */
  refraction: number;
  /** Frost on the flat face, as a blur radius in px. The rim stays crisp. */
  frost: number;
}

/** Marks an element as a pane of glass for the nearest <LiquidField> to refract. */
export const glassAttrs = ({ radius, bezel, refraction, frost }: LiquidGlass) => ({
  'data-liquid-glass': `${radius},${bezel},${refraction},${frost}`,
});

const VERTEX_SHADER = `#version 300 es
in vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// Metaball field: each blob contributes r²/d². Where the sum crosses 1 the
// surface is drawn as glossy liquid — the field's gradient doubles as a
// surface normal for diffuse + specular light; below 1 it fades into a glow.
//
// Glass panes are refracted here too, analytically: inside a pane's rounded
// rect, pixels near the rim sample the field from further inward (a convex
// bevel), and the flat face softens the surface edge to fake frost. Doing it
// in the shader instead of an SVG backdrop-filter keeps it at 60fps and makes
// it work in every browser with WebGL2.
const FRAGMENT_SHADER = `#version 300 es
precision highp float;
#define N ${BLOB_COUNT}
#define G ${MAX_GLASS}
uniform vec3 uBlobs[N];
uniform vec3 uColors[N];
uniform vec4 uGlassRect[G];   // centre x, centre y, half width, half height
uniform vec4 uGlassParams[G]; // radius, bezel, refraction, frost
uniform int uGlassCount;
uniform float uNormalScale;
out vec4 outColor;

void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 q = p;
  float frost = 0.0;

  for (int i = 0; i < G; i++) {
    if (i >= uGlassCount) break;
    vec4 rect = uGlassRect[i];
    vec4 g = uGlassParams[i];
    vec2 d = p - rect.xy;
    float r = min(g.x, min(rect.z, rect.w));
    vec2 k = abs(d) - (rect.zw - r);
    float sd = length(max(k, 0.0)) + min(max(k.x, k.y), 0.0) - r;
    if (sd < 0.0) {
      vec2 n = (k.x > 0.0 && k.y > 0.0) ? normalize(k) : (k.x > k.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0));
      n *= vec2(d.x < 0.0 ? -1.0 : 1.0, d.y < 0.0 ? -1.0 : 1.0);
      float t = clamp(1.0 + sd / g.y, 0.0, 1.0);
      q = p - n * g.z * t * t;
      frost = g.w * (1.0 - smoothstep(0.0, 0.5, t));
      break;
    }
  }

  float field = 0.0;
  vec3 color = vec3(0.0);
  vec2 grad = vec2(0.0);

  for (int i = 0; i < N; i++) {
    vec3 b = uBlobs[i];
    if (b.z <= 0.5) continue;
    vec2 d = q - b.xy;
    float d2 = dot(d, d) + 1.0;
    float k = (b.z * b.z) / d2;
    field += k;
    color += uColors[i] * k;
    grad -= 2.0 * k * d / d2;
  }

  color /= max(field, 1e-4);

  // The field changes by |grad| per pixel near the surface, so a blur of
  // 'frost' px is a smoothstep that wide in field units.
  float slope = length(grad);
  float soft = slope * (0.8 + frost);
  float surface = smoothstep(1.0 - soft, 1.0 + soft, field);

  vec3 n = normalize(vec3(-grad * uNormalScale, 1.0));
  vec3 light = normalize(vec3(-0.45, 0.65, 0.9));
  float diffuse = clamp(dot(n, light), 0.0, 1.0);
  float specular = pow(clamp(dot(reflect(-light, n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 36.0);
  specular *= 1.0 - clamp(frost / 24.0, 0.0, 0.75);
  float fresnel = pow(1.0 - n.z, 2.0);

  vec3 liquid = color * (0.45 + 0.6 * diffuse) + fresnel * color * 0.6 + specular * 0.9;
  float glow = smoothstep(0.12, 1.0, field) * 0.28;

  // Premultiplied alpha.
  vec3 rgb = mix(color * glow, liquid, surface);
  float alpha = max(surface, glow);
  outColor = vec4(rgb, alpha);
}`;

const hex = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];

interface Drop {
  /** Home position as a fraction of the field size. */
  hx: number;
  hy: number;
  /** Drift amplitude (fraction of size) and speed. */
  ax: number;
  ay: number;
  sx: number;
  sy: number;
  phase: number;
  /** Radius relative to the base radius. */
  size: number;
  color: [number, number, number];
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const AMBIENT: Omit<Drop, 'x' | 'y' | 'vx' | 'vy'>[] = [
  { hx: 0.14, hy: 0.3, ax: 0.06, ay: 0.12, sx: 0.21, sy: 0.17, phase: 0.0, size: 1.15, color: hex('#FF0080') },
  { hx: 0.34, hy: 0.78, ax: 0.08, ay: 0.08, sx: 0.16, sy: 0.23, phase: 1.7, size: 0.85, color: hex('#7C5CFF') },
  { hx: 0.52, hy: 0.22, ax: 0.1, ay: 0.06, sx: 0.13, sy: 0.19, phase: 3.1, size: 0.75, color: hex('#FF6B35') },
  { hx: 0.7, hy: 0.62, ax: 0.07, ay: 0.12, sx: 0.18, sy: 0.14, phase: 4.4, size: 1.25, color: hex('#FF2D6F') },
  { hx: 0.88, hy: 0.28, ax: 0.05, ay: 0.1, sx: 0.24, sy: 0.15, phase: 2.3, size: 0.9, color: hex('#FF8A3D') },
  { hx: 0.9, hy: 0.84, ax: 0.06, ay: 0.06, sx: 0.12, sy: 0.2, phase: 5.2, size: 0.7, color: hex('#38BDF8') },
];

const CURSOR_COLOR = hex('#FF3D8B');
const TAIL_COLOR = hex('#FF6B35');

/** How far (px) the cursor's pull reaches, and how strongly drops lean toward it. */
const PULL_RADIUS = 280;
const PULL_STRENGTH = 0.38;

/** Product of inline opacities up to `root`, so panes fading in refract in step. */
function visibleOpacity(el: HTMLElement, root: HTMLElement) {
  let opacity = 1;
  for (let node: HTMLElement | null = el; node && node !== root; node = node.parentElement) {
    const value = node.style.opacity;
    if (value !== '') opacity *= Number(value);
  }
  return opacity;
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * A field of glossy liquid drops that drift on their own and are drawn toward
 * the pointer; the pointer carries its own drop (plus a lagging tail, so fast
 * moves stretch the liquid) that merges with whatever it passes. Pressing
 * swells it.
 */
export default function LiquidField({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = canvas?.parentElement;
    if (!canvas || !stage) return;
    const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uBlobs = gl.getUniformLocation(program, 'uBlobs');
    const uColors = gl.getUniformLocation(program, 'uColors');
    const uNormalScale = gl.getUniformLocation(program, 'uNormalScale');
    const uGlassRect = gl.getUniformLocation(program, 'uGlassRect');
    const uGlassParams = gl.getUniformLocation(program, 'uGlassParams');
    const uGlassCount = gl.getUniformLocation(program, 'uGlassCount');
    const glassRects = new Float32Array(MAX_GLASS * 4);
    const glassParams = new Float32Array(MAX_GLASS * 4);

    const colors = new Float32Array(BLOB_COUNT * 3);
    AMBIENT.forEach((d, i) => colors.set(d.color, i * 3));
    colors.set(CURSOR_COLOR, 6 * 3);
    colors.set(TAIL_COLOR, 7 * 3);
    gl.uniform3fv(uColors, colors);

    const blobs = new Float32Array(BLOB_COUNT * 3);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let base = 80;

    const drops: Drop[] = AMBIENT.map((d) => ({ ...d, x: 0, y: 0, vx: 0, vy: 0 }));
    const cursor = { x: 0, y: 0, vx: 0, vy: 0, r: 0 };
    const tail = { x: 0, y: 0, vx: 0, vy: 0, r: 0 };
    const pointer = { clientX: -1e4, clientY: -1e4, inside: false, pressed: false };
    let placed = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      base = Math.min(130, Math.max(56, Math.min(width, height) * 0.13));
      gl.uniform1f(uNormalScale, base * dpr * 0.55);
      if (!placed && width > 0) {
        drops.forEach((d) => {
          d.x = d.hx * width;
          d.y = d.hy * height;
        });
        cursor.x = tail.x = width / 2;
        cursor.y = tail.y = height / 2;
        placed = true;
      }
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const onPointerMove = (e: PointerEvent) => {
      pointer.clientX = e.clientX;
      pointer.clientY = e.clientY;
    };
    const onPointerDown = () => {
      pointer.pressed = true;
    };
    const onPointerUp = () => {
      pointer.pressed = false;
    };
    const onPointerLeave = () => {
      pointer.clientX = pointer.clientY = -1e4;
      pointer.pressed = false;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);

    let frame = 0;
    let running = false;
    let last = performance.now();
    let elapsed = 0;

    const spring = (
      body: { x: number; y: number; vx: number; vy: number },
      tx: number,
      ty: number,
      stiffness: number,
      damping: number,
      dt: number,
    ) => {
      body.vx = (body.vx + (tx - body.x) * stiffness * dt) * Math.pow(damping, dt);
      body.vy = (body.vy + (ty - body.y) * stiffness * dt) * Math.pow(damping, dt);
      body.x += body.vx * dt;
      body.y += body.vy * dt;
    };

    const render = (now: number) => {
      // dt in 60fps frames, clamped so a backgrounded tab doesn't explode the springs.
      const dt = Math.min((now - last) / 16.667, 3);
      last = now;
      if (!reduceMotion) elapsed += dt / 60;

      const rect = canvas.getBoundingClientRect();
      const px = pointer.clientX - rect.left;
      const py = pointer.clientY - rect.top;
      pointer.inside = px >= -40 && py >= -40 && px <= rect.width + 40 && py <= rect.height + 40;

      drops.forEach((d, i) => {
        let tx = (d.hx + d.ax * Math.sin(elapsed * d.sx * 2 * Math.PI * 0.25 + d.phase)) * width;
        let ty = (d.hy + d.ay * Math.cos(elapsed * d.sy * 2 * Math.PI * 0.25 + d.phase)) * height;
        if (pointer.inside) {
          const dx = px - tx;
          const dy = py - ty;
          const falloff = Math.exp(-(dx * dx + dy * dy) / (2 * PULL_RADIUS * PULL_RADIUS));
          tx += dx * PULL_STRENGTH * falloff;
          ty += dy * PULL_STRENGTH * falloff;
        }
        spring(d, tx, ty, 0.012, 0.9, dt);
        blobs[i * 3] = d.x * dpr;
        blobs[i * 3 + 1] = (height - d.y) * dpr;
        blobs[i * 3 + 2] = d.size * base * dpr;
      });

      const targetR = pointer.inside ? base * (pointer.pressed ? 1.25 : 0.82) : 0;
      cursor.r += (targetR - cursor.r) * Math.min(1, 0.12 * dt);
      if (pointer.inside) spring(cursor, px, py, 0.09, 0.72, dt);
      spring(tail, cursor.x, cursor.y, 0.035, 0.8, dt);
      tail.r = cursor.r * 0.62;

      blobs[18] = cursor.x * dpr;
      blobs[19] = (height - cursor.y) * dpr;
      blobs[20] = cursor.r * dpr;
      blobs[21] = tail.x * dpr;
      blobs[22] = (height - tail.y) * dpr;
      blobs[23] = tail.r * dpr;

      // Panes are re-measured every frame so hover scaling, entrance
      // animations and smooth scrolling all stay in register.
      const panes = stage.querySelectorAll<HTMLElement>('[data-liquid-glass]');
      let count = 0;
      for (const pane of panes) {
        if (count >= MAX_GLASS) break;
        const r = pane.getBoundingClientRect();
        if (r.width === 0 || r.bottom < rect.top || r.top > rect.bottom) continue;
        const [radius, bezel, refraction, frost] = (pane.dataset.liquidGlass ?? '')
          .split(',')
          .map(Number);
        const presence = visibleOpacity(pane, stage);
        const o = count * 4;
        glassRects[o] = (r.left - rect.left + r.width / 2) * dpr;
        glassRects[o + 1] = (height - (r.top - rect.top + r.height / 2)) * dpr;
        glassRects[o + 2] = (r.width / 2) * dpr;
        glassRects[o + 3] = (r.height / 2) * dpr;
        glassParams[o] = radius * dpr;
        glassParams[o + 1] = bezel * dpr;
        glassParams[o + 2] = refraction * presence * dpr;
        glassParams[o + 3] = frost * presence * dpr;
        count++;
      }

      gl.uniform4fv(uGlassRect, glassRects);
      gl.uniform4fv(uGlassParams, glassParams);
      gl.uniform1i(uGlassCount, count);

      gl.uniform3fv(uBlobs, blobs);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      frame = requestAnimationFrame(render);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(render);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    // Only animate while the field is on screen and the tab is visible.
    let onScreen = false;
    const sync = () => (onScreen && !document.hidden ? start() : stop());
    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    intersection.observe(canvas);
    document.addEventListener('visibilitychange', sync);

    return () => {
      stop();
      intersection.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return <canvas ref={canvasRef} className={`contact-liquid ${className}`} aria-hidden="true" />;
}
