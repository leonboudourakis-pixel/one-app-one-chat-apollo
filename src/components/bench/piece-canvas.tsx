import { useEffect, useRef } from "react";
import type { AppSpec, RulesSpec } from "@/lib/bench/model";

export type PieceHud = {
  mode: RulesSpec["mode"];
  score: number;
  lives: number;
  goal: number;
  over: boolean;
};

type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  seed: number;
  spin: number;
  angle: number;
  dead: number;
};

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function mix(a: string, b: string, t: number): string {
  const from = hexToRgb(a);
  const to = hexToRgb(b);
  const channel = (index: number) => Math.round(from[index]! + (to[index]! - from[index]!) * t);
  return `rgb(${channel(0)} ${channel(1)} ${channel(2)})`;
}

function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

function spawn(width: number, top: number, bottom: number, fromTop: boolean): Body {
  const span = Math.max(1, bottom - top);
  return {
    x: 24 + Math.random() * Math.max(1, width - 48),
    y: fromTop ? top + 10 : top + Math.random() * span,
    vx: (Math.random() - 0.5) * 50,
    vy: Math.random() * 40,
    seed: Math.random(),
    spin: Math.random() * Math.PI * 2,
    angle: Math.random() * Math.PI * 2,
    dead: 0,
  };
}

export function PieceCanvas({
  spec,
  active,
  onHud,
}: {
  spec: AppSpec;
  active: boolean;
  onHud: (hud: PieceHud) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const specRef = useRef(spec);
  const activeRef = useRef(active);
  const onHudRef = useRef(onHud);
  specRef.current = spec;
  activeRef.current = active;
  onHudRef.current = onHud;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx = context;

    const pointer = { x: 0, y: 0, inside: false };
    const bodies: Body[] = [];
    let score = 0;
    let lives = specRef.current.rules.lives;
    let over = false;
    let mode = specRef.current.rules.mode;
    let width = 1;
    let height = 1;
    let last = performance.now();
    let lastBlip = 0;
    let audio: AudioContext | null = null;
    let raf = 0;
    let stopped = false;

    const publish = () => {
      const current = specRef.current;
      onHudRef.current({
        mode: current.rules.mode,
        score,
        lives,
        goal: current.rules.goal,
        over,
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const blip = () => {
      const sound = specRef.current.sound;
      if (!sound.enabled || sound.volume <= 0 || !audio) return;
      const now = audio.currentTime;
      if (performance.now() - lastBlip < 70) return;
      lastBlip = performance.now();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = sound.tone;
      gain.gain.setValueAtTime(Math.max(0.0001, sound.volume * 0.08), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.09);
    };

    const ensureAudio = () => {
      if (!specRef.current.sound.enabled) return;
      if (!audio) audio = new AudioContext();
      void audio.resume();
    };

    const resetRound = () => {
      score = 0;
      lives = specRef.current.rules.lives;
      over = false;
      const top = 78;
      const bottom = Math.max(top + 40, height - 64);
      for (const body of bodies) {
        const next = spawn(width, top, bottom, false);
        Object.assign(body, next, { dead: 0 });
      }
      publish();
    };

    const frame = (now: number) => {
      if (stopped) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (!activeRef.current) return;
      resize();
      if (width < 2 || height < 2) return;

      const current = specRef.current;
      if (current.rules.mode !== mode) {
        mode = current.rules.mode;
        score = 0;
        lives = current.rules.lives;
        over = false;
        publish();
      }
      if (!over && lives > current.rules.lives) lives = current.rules.lives;
      const count = Math.round(current.motion.count);
      const top = 78;
      const bottom = Math.max(top + 40, height - 64);
      while (bodies.length < count) bodies.push(spawn(width, top, bottom, false));
      while (bodies.length > count) bodies.pop();

      const radius = 12 * current.motion.size;
      const bounce = current.physics.bounce;
      const drag = Math.exp(-current.physics.drag * dt);

      for (const body of bodies) {
        if (body.dead > 0) {
          body.dead -= dt;
          if (body.dead <= 0) Object.assign(body, spawn(width, top, bottom, true), { dead: 0 });
          continue;
        }
        body.vx += current.physics.wind * dt;
        body.vy += current.physics.gravity * dt;
        body.vx *= drag;
        body.vy *= drag;
        body.x += body.vx * dt;
        body.y += body.vy * dt;
        body.angle += current.motion.spin * dt * (body.seed - 0.5) * 2;
        if (body.x < radius) {
          body.x = radius;
          body.vx = Math.abs(body.vx) * bounce;
        } else if (body.x > width - radius) {
          body.x = width - radius;
          body.vx = -Math.abs(body.vx) * bounce;
        }
        if (body.y < top + radius) {
          body.y = top + radius;
          body.vy = Math.abs(body.vy) * bounce;
        } else if (body.y > bottom - radius) {
          body.y = bottom - radius;
          body.vy = -Math.abs(body.vy) * bounce;
        }
      }

      if (!over && current.rules.mode === "catch" && pointer.inside) {
        for (const body of bodies) {
          const dx = body.x - pointer.x;
          const dy = body.y - pointer.y;
          if (dx * dx + dy * dy < (radius + 30) * (radius + 30)) {
            score += 1;
            Object.assign(body, spawn(width, top, bottom, true));
            blip();
            if (score >= current.rules.goal) over = true;
            publish();
          }
        }
      }

      if (!over && current.rules.mode === "dodge" && pointer.inside) {
        for (const body of bodies) {
          if (body.dead > 0) continue;
          const dx = body.x - pointer.x;
          const dy = body.y - pointer.y;
          if (dx * dx + dy * dy < (radius + 16) * (radius + 16)) {
            lives -= 1;
            body.dead = 0.8;
            blip();
            if (lives <= 0) over = true;
            publish();
          }
        }
      }

      const fade = 1 - current.graphics.trail * 0.88;
      ctx.fillStyle = withAlpha(current.graphics.background, fade);
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = current.graphics.background;
      ctx.fillRect(0, 0, width, top);
      ctx.fillRect(0, bottom, width, height - bottom);

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, top, width, bottom - top);
      ctx.clip();
      for (const body of bodies) {
        if (body.dead > 0) continue;
        ctx.save();
        ctx.translate(body.x, body.y);
        ctx.rotate(body.angle);
        ctx.fillStyle = mix(current.graphics.accent, current.graphics.ink, 0.15 + body.seed * 0.35);
        ctx.strokeStyle = ctx.fillStyle;
        if (current.graphics.glow > 0.02) {
          ctx.shadowBlur = current.graphics.glow * 18;
          ctx.shadowColor = current.graphics.accent;
        }
        const shape = current.graphics.shape;
        if (shape === "orb") {
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (shape === "ring") {
          ctx.lineWidth = Math.max(2, radius * 0.28);
          ctx.beginPath();
          ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
          ctx.stroke();
        } else if (shape === "shard") {
          ctx.beginPath();
          ctx.moveTo(0, -radius);
          ctx.lineTo(radius * 0.86, radius * 0.7);
          ctx.lineTo(-radius * 0.86, radius * 0.7);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.roundRect(-radius, -radius, radius * 2, radius * 2, 4);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.restore();

      if (pointer.inside && (current.rules.mode === "catch" || current.rules.mode === "dodge")) {
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, current.rules.mode === "catch" ? 18 : 12, 0, Math.PI * 2);
        ctx.strokeStyle = current.graphics.ink;
        ctx.lineWidth = 1.5;
        if (current.rules.mode === "dodge") {
          ctx.fillStyle = current.graphics.ink;
          ctx.fill();
        } else {
          ctx.stroke();
        }
      }

      ctx.fillStyle = current.graphics.ink;
      ctx.textBaseline = "top";
      if (current.copy.title) {
        let titleSize = 28;
        const title = current.copy.title;
        ctx.font = `600 ${titleSize}px Newsreader, Georgia, serif`;
        while (titleSize > 16 && ctx.measureText(title).width > width - 48) {
          titleSize -= 2;
          ctx.font = `600 ${titleSize}px Newsreader, Georgia, serif`;
        }
        ctx.fillText(title, 20, 18);
      }
      ctx.font = "400 14px Figtree, sans-serif";
      const hint = over
        ? current.rules.mode === "catch"
          ? "Cleared. Click to run it again."
          : "Hit. Click to try again."
        : current.copy.hint;
      if (hint) ctx.fillText(hint, 20, bottom + 16);

      if (score >= current.rules.goal && current.rules.mode === "catch") over = true;
    };

    const point = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.inside = true;
    };

    const onDown = (event: PointerEvent) => {
      point(event);
      canvas.setPointerCapture?.(event.pointerId);
      ensureAudio();
      if (over) {
        resetRound();
        return;
      }
      if (specRef.current.rules.mode === "drift") {
        const top = 78;
        const bottom = Math.max(top + 40, height - 64);
        const radius = 12 * specRef.current.motion.size;
        for (const body of bodies) {
          if (body.y < top || body.y > bottom) continue;
          const dx = body.x - pointer.x;
          const dy = body.y - pointer.y;
          if (dx * dx + dy * dy < (radius + 120) * (radius + 120)) {
            body.vx += dx * 3;
            body.vy += dy * 3 - 120;
          }
        }
      }
    };

    const onMove = (event: PointerEvent) => point(event);
    const onLeave = () => {
      pointer.inside = false;
    };

    resize();
    publish();
    raf = requestAnimationFrame(frame);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      void audio?.close();
    };
  }, []);

  return <canvas ref={canvasRef} className="block h-full w-full touch-none" />;
}
