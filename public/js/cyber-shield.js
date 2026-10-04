/**
 * LinkShield Pro - Ultra-Premium Cyber Shield Defense Background Engine
 * Rich interactive features:
 * - Floating Vector Defense Crests with Holographic Laser Sheens
 * - Dual Rotating Hologram Caliper / Radar Compass Rings
 * - Interactive Shield Impact Shockwaves on click/tap
 * - Floating Golden Cyber Motes & Ascending Energy Sparks
 * - Magnetic Cursor Orbiting Defense Satellites
 * - Interactive Micro Hex-Grid & Golden Defense Spotlight
 */
(function () {
  'use strict';

  const canvas = document.createElement('canvas');
  canvas.id = 'cyberShieldCanvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '0';
  canvas.style.opacity = '1';

  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    init();
  }

  let initialized = false;
  function init() {
    if (initialized) return;
    initialized = true;

    if (!document.getElementById('cyberShieldCanvas')) {
      document.body.insertBefore(canvas, document.body.firstChild);
    }

    startCyberShieldEngine(canvas);
  }

  function startCyberShieldEngine(canvas) {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouse = {
      x: width * 0.5,
      y: height * 0.35,
      targetX: width * 0.5,
      targetY: height * 0.35,
      speed: 0.08
    };

    // Click / Touch Shockwave Ripples
    let shockwaves = [];

    window.addEventListener('mousemove', function (e) {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    });

    window.addEventListener('pointerdown', function (e) {
      // Spawn energy shield shockwave ripple on click
      spawnShockwave(e.clientX, e.clientY);
    });

    function spawnShockwave(x, y) {
      shockwaves.push({
        x: x,
        y: y,
        radius: 10,
        maxRadius: Math.min(width, height) * 0.45,
        alpha: 0.7,
        growth: 6.5,
        hexAngle: Math.random() * Math.PI
      });
    }

    window.addEventListener('resize', function () {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initElements();
    });

    // 1. Cyber Shields Data
    let shields = [];
    const shieldCount = 7;

    // 2. Cyber Network Constellation Nodes
    let nodes = [];
    const nodeCount = 36;

    // 3. Ascending Cyber Sparks / Energy Fireflies
    let sparks = [];
    const sparkCount = 32;

    // 4. Cursor Orbiting Defense Satellites
    let cursorSatellites = [];
    const satelliteCount = 5;

    // 5. Radar Scan Sweep
    let scanY = -120;
    const scanSpeed = 1.35;

    function initElements() {
      shields = [];
      const presets = [
        { xRatio: 0.12, yRatio: 0.24, scale: 1.45, speed: 0.28, rotSpeed: 0.0012, baseAlpha: 0.42, hasHoloDials: true },
        { xRatio: 0.88, yRatio: 0.26, scale: 1.55, speed: 0.22, rotSpeed: -0.001, baseAlpha: 0.4, hasHoloDials: true },
        { xRatio: 0.20, yRatio: 0.76, scale: 1.15, speed: 0.32, rotSpeed: 0.0015, baseAlpha: 0.35, hasHoloDials: false },
        { xRatio: 0.84, yRatio: 0.78, scale: 1.3, speed: 0.26, rotSpeed: -0.0012, baseAlpha: 0.36, hasHoloDials: true },
        { xRatio: 0.50, yRatio: 0.12, scale: 0.95, speed: 0.38, rotSpeed: 0.002, baseAlpha: 0.28, hasHoloDials: false },
        { xRatio: 0.06, yRatio: 0.86, scale: 1.65, speed: 0.18, rotSpeed: -0.0008, baseAlpha: 0.32, hasHoloDials: true },
        { xRatio: 0.94, yRatio: 0.52, scale: 1.2, speed: 0.3, rotSpeed: 0.0014, baseAlpha: 0.35, hasHoloDials: false }
      ];

      for (let i = 0; i < shieldCount; i++) {
        const p = presets[i % presets.length];
        shields.push({
          x: width * p.xRatio,
          y: height * p.yRatio,
          originX: width * p.xRatio,
          originY: height * p.yRatio,
          scale: p.scale,
          angle: (Math.random() - 0.5) * 0.15,
          rotSpeed: p.rotSpeed,
          speed: p.speed,
          baseAlpha: p.baseAlpha,
          bobOffset: Math.random() * Math.PI * 2,
          hasHoloDials: p.hasHoloDials,
          glintOffset: Math.random() * Math.PI * 2
        });
      }

      nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: Math.random() * 2 + 1.2,
          alpha: Math.random() * 0.35 + 0.25,
          pulse: Math.random() * Math.PI * 2
        });
      }

      sparks = [];
      for (let i = 0; i < sparkCount; i++) {
        sparks.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2.2 + 0.8,
          speedY: Math.random() * 0.6 + 0.3,
          speedX: (Math.random() - 0.5) * 0.3,
          alpha: Math.random() * 0.5 + 0.2,
          swayOffset: Math.random() * Math.PI * 2,
          swaySpeed: Math.random() * 0.02 + 0.01
        });
      }

      cursorSatellites = [];
      for (let i = 0; i < satelliteCount; i++) {
        cursorSatellites.push({
          angle: (i / satelliteCount) * Math.PI * 2,
          distance: 55 + i * 16,
          speed: 0.025 + i * 0.008,
          size: 2.2 + (i % 2 === 0 ? 1 : 0),
          alpha: 0.65 - i * 0.08
        });
      }
    }

    initElements();

    // Render A Luxury Holographic Cyber Security Shield
    function renderShield(x, y, scale, angle, alpha, time, hasHoloDials, glintOffset) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);

      // 1. Dual Holographic Caliper / Radar Rings (Opposing Rotations)
      if (hasHoloDials) {
        // Outer Radar Caliper
        ctx.save();
        ctx.rotate(time * 0.15);
        ctx.beginPath();
        ctx.arc(0, 0, 68, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(180, 83, 9, ${alpha * 0.25})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 12, 16, 12]);
        ctx.stroke();

        // 12 Caliper Ticks
        for (let t = 0; t < 12; t++) {
          const a = (t / 12) * Math.PI * 2;
          const cos = Math.cos(a);
          const sin = Math.sin(a);
          ctx.beginPath();
          ctx.moveTo(cos * 64, sin * 64);
          ctx.lineTo(cos * 72, sin * 72);
          ctx.strokeStyle = `rgba(217, 119, 6, ${alpha * 0.35})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        ctx.restore();

        // Inner Counter-Rotating Orbit Ring
        ctx.save();
        ctx.rotate(-time * 0.22);
        ctx.beginPath();
        ctx.arc(0, 0, 56, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245, 158, 11, ${alpha * 0.28})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 14]);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Outer Crest Shield Geometry
      ctx.beginPath();
      ctx.moveTo(0, -48);
      ctx.lineTo(34, -32);
      ctx.quadraticCurveTo(38, 12, 22, 32);
      ctx.lineTo(0, 50);
      ctx.lineTo(-22, 32);
      ctx.quadraticCurveTo(-38, 12, -34, -32);
      ctx.closePath();

      ctx.strokeStyle = `rgba(180, 83, 9, ${alpha * 0.45})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Soft Inner Defense Aura Fill
      const shieldGlowGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
      shieldGlowGrad.addColorStop(0, `rgba(245, 158, 11, ${alpha * 0.12})`);
      shieldGlowGrad.addColorStop(1, `rgba(217, 119, 6, ${alpha * 0.02})`);
      ctx.fillStyle = shieldGlowGrad;
      ctx.fill();

      // 3. Inner Contour Shield
      ctx.beginPath();
      ctx.moveTo(0, -36);
      ctx.lineTo(24, -24);
      ctx.quadraticCurveTo(27, 8, 16, 22);
      ctx.lineTo(0, 36);
      ctx.lineTo(-16, 22);
      ctx.quadraticCurveTo(-27, 8, -24, -24);
      ctx.closePath();

      ctx.strokeStyle = `rgba(217, 119, 6, ${alpha * 0.7})`;
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // 4. Cyber Crosshair Grid Lines inside shield
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(18, 0);
      ctx.moveTo(0, -22);
      ctx.lineTo(0, 22);
      ctx.strokeStyle = `rgba(217, 119, 6, ${alpha * 0.3})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // 5. Holographic Traveling Laser Glint
      const glintProg = ((time * 0.7 + glintOffset) % (Math.PI * 2)) / (Math.PI * 2);
      const glintY = -45 + glintProg * 90;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-20, glintY);
      ctx.lineTo(20, glintY);
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.sin(glintProg * Math.PI) * alpha * 0.85})`;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = 'rgba(251, 191, 36, 0.9)';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();

      // 6. Central Shield Security Core Node
      ctx.beginPath();
      ctx.arc(0, 0, 3.8 + Math.sin(time * 3 + glintOffset) * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245, 158, 11, ${alpha * 0.95})`;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    }

    let time = 0;

    function render() {
      time += 0.016;

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * mouse.speed;
      mouse.y += (mouse.targetY - mouse.y) * mouse.speed;

      ctx.clearRect(0, 0, width, height);

      // 1. Subtle Interactive Mouse Golden Spotlight
      const spotlightRadius = 400;
      const grad = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, spotlightRadius
      );
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.09)');
      grad.addColorStop(0.5, 'rgba(217, 119, 6, 0.035)');
      grad.addColorStop(1, 'rgba(230, 236, 244, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Micro Cyber Hex-Grid Overlay
      const gridStep = 46;
      for (let x = 0; x < width; x += gridStep) {
        for (let y = 0; y < height; y += gridStep) {
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 280) {
            const glow = (1 - dist / 280) * 0.42;
            ctx.fillStyle = `rgba(217, 119, 6, ${0.16 + glow})`;
            ctx.fillRect(x, y, 2.2, 2.2);
          } else {
            ctx.fillStyle = 'rgba(197, 203, 215, 0.25)';
            ctx.fillRect(x, y, 1.3, 1.3);
          }
        }
      }

      // 3. Render Ascending Cyber Sparks / Energy Fireflies
      for (let i = 0; i < sparks.length; i++) {
        const sp = sparks[i];
        sp.y -= sp.speedY;
        sp.x += Math.sin(time * 2 + sp.swayOffset) * 0.5 + sp.speedX;

        if (sp.y < -20) {
          sp.y = height + 20;
          sp.x = Math.random() * width;
        }

        const sparkAlpha = (Math.sin(time * 2 + sp.swayOffset) * 0.3 + 0.7) * sp.alpha;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${sparkAlpha})`;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 4. Render Cyber Defense Nodes & Connecting Data Links
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.035;

        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        // Node Glow
        ctx.beginPath();
        const r = n.radius + Math.sin(n.pulse) * 0.7;
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(217, 119, 6, ${n.alpha})`;
        ctx.fill();

        // Connect nearby nodes with delicate lines
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dist = Math.hypot(n.x - n2.x, n.y - n2.y);
          if (dist < 135) {
            const lineAlpha = (1 - dist / 135) * 0.22;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(180, 83, 9, ${lineAlpha})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }
      }

      // 5. Render Orbiting Cursor Satellites
      for (let i = 0; i < cursorSatellites.length; i++) {
        const sat = cursorSatellites[i];
        sat.angle += sat.speed;
        const satX = mouse.x + Math.cos(sat.angle) * sat.distance;
        const satY = mouse.y + Math.sin(sat.angle) * (sat.distance * 0.6);

        ctx.beginPath();
        ctx.arc(satX, satY, sat.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${sat.alpha})`;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.7)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Faint connecting ray to cursor
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(satX, satY);
        ctx.strokeStyle = `rgba(217, 119, 6, ${sat.alpha * 0.25})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // 6. Interactive Click Shockwaves (Shield Energy Ripple)
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += sw.growth;
        sw.alpha *= 0.94;

        if (sw.radius > sw.maxRadius || sw.alpha < 0.02) {
          shockwaves.splice(i, 1);
          continue;
        }

        // Concentric Defense Shockwave Ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245, 158, 11, ${sw.alpha * 0.7})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
        ctx.shadowBlur = 12;
        ctx.stroke();

        // Inner Hexagonal Perimeter Pulse
        ctx.beginPath();
        const hexR = sw.radius * 0.75;
        for (let h = 0; h < 6; h++) {
          const a = sw.hexAngle + (h / 6) * Math.PI * 2;
          const hx = sw.x + Math.cos(a) * hexR;
          const hy = sw.y + Math.sin(a) * hexR;
          if (h === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(217, 119, 6, ${sw.alpha * 0.45})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      }

      // 7. Subtle Radar Scan Beam
      scanY += scanSpeed;
      if (scanY > height + 80) scanY = -80;

      const scanGrad = ctx.createLinearGradient(0, scanY - 35, 0, scanY + 35);
      scanGrad.addColorStop(0, 'rgba(217, 119, 6, 0)');
      scanGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.07)');
      scanGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');

      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 35, width, 70);

      // 8. Render Floating Cyber Shields with Gentle 3D Parallax & Laser Glint
      const mouseParallaxX = (mouse.x - width * 0.5) * 0.035;
      const mouseParallaxY = (mouse.y - height * 0.5) * 0.035;

      for (let i = 0; i < shields.length; i++) {
        const s = shields[i];
        s.angle += s.rotSpeed;
        const bob = Math.sin(time * s.speed + s.bobOffset) * 15;

        const currentX = s.originX + mouseParallaxX * (i % 2 === 0 ? 1 : -0.85);
        const currentY = s.originY + bob + mouseParallaxY * (i % 2 === 0 ? 1 : -0.85);

        renderShield(
          currentX,
          currentY,
          s.scale,
          s.angle,
          s.baseAlpha,
          time,
          s.hasHoloDials,
          s.glintOffset
        );
      }

      requestAnimationFrame(render);
    }

    render();
  }
})();
