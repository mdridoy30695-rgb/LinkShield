// ==========================================================================
// LinkShield Pro - Royal Golden Cosmos Particle Background Animation Engine v2.0
// Features: Dynamic Constellations, Diamond 4-Point Stars, Shooting Comets,
// Multi-depth 3D Parallax, and Interactive Golden Mouse Sparkles & Ripples.
// 60 FPS, Battery Optimized, Ultra-Luxury Aesthetics.
// ==========================================================================

(function () {
  const canvas = document.getElementById('goldenCosmosCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  // Mouse tracking state
  let mouse = {
    x: width / 2,
    y: height / 2,
    vx: 0,
    vy: 0,
    prevX: width / 2,
    prevY: height / 2,
    active: false,
    radius: 180
  };

  const GOLD_PALETTE = [
    { r: 255, g: 255, b: 255 }, // #ffffff Pure Starlight Diamond
    { r: 254, g: 249, b: 195 }, // #fef9c3 Diamond Champagne
    { r: 254, g: 240, b: 138 }, // #fef08a Radiant Gold
    { r: 250, g: 204, b: 21 },  // #facc15 24K Royal Gold
    { r: 234, g: 179, b: 8 },   // #eab308 Deep Warm Gold
    { r: 202, g: 138, b: 4 }    // #ca8a04 Bronze Amber
  ];

  // Particle count based on viewport
  const getParticleCount = () => {
    if (window.innerWidth < 640) return 48;
    if (window.innerWidth < 1200) return 75;
    return 105;
  };

  // ==========================================================================
  // 1. GOLDEN PARTICLES (Stars, Dust & Diamond Flares)
  // ==========================================================================
  class GoldenParticle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 15;
      
      // Multi-depth layers (1: far, 2: mid, 3: near)
      this.layer = Math.random() < 0.25 ? 3 : (Math.random() < 0.6 ? 2 : 1);
      
      if (this.layer === 1) {
        this.size = Math.random() * 1.2 + 0.6; // Small background stardust
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = -(Math.random() * 0.25 + 0.12);
        this.baseAlpha = Math.random() * 0.35 + 0.2;
      } else if (this.layer === 2) {
        this.size = Math.random() * 1.8 + 1.2; // Midground constellation nodes
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = -(Math.random() * 0.45 + 0.2);
        this.baseAlpha = Math.random() * 0.45 + 0.35;
      } else {
        this.size = Math.random() * 2.6 + 2.0; // Foreground large glowing embers
        this.vx = (Math.random() - 0.5) * 0.55;
        this.vy = -(Math.random() * 0.65 + 0.3);
        this.baseAlpha = Math.random() * 0.55 + 0.45;
      }

      this.color = GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)];
      this.alpha = this.baseAlpha;

      // Type: 0: normal circle, 1: 4-point diamond star sparkle, 2: glowing aura orb
      this.type = Math.random() < 0.22 ? 1 : (this.layer === 3 ? 2 : 0);
      
      // Rotation for 4-point stars
      this.rotation = Math.random() * Math.PI;
      this.rotSpeed = (Math.random() - 0.5) * 0.02;

      // Pulse / twinkle parameters
      this.twinkleSpeed = Math.random() * 0.025 + 0.012;
      this.twinkleAngle = Math.random() * Math.PI * 2;
      this.wobbleSpeed = Math.random() * 0.018 + 0.008;
      this.wobbleAngle = Math.random() * Math.PI * 2;
    }

    update() {
      this.twinkleAngle += this.twinkleSpeed;
      this.wobbleAngle += this.wobbleSpeed;
      this.rotation += this.rotSpeed;

      // Dynamic alpha pulse
      this.alpha = this.baseAlpha + Math.sin(this.twinkleAngle) * 0.25;
      if (this.alpha < 0.12) this.alpha = 0.12;
      if (this.alpha > 0.98) this.alpha = 0.98;

      // Gentle wobble drift
      const currentVx = this.vx + Math.sin(this.wobbleAngle) * 0.18;
      this.x += currentVx;
      this.y += this.vy;

      // Interactive mouse gravity / avoidance
      if (mouse.active) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius && dist > 0) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          // Push gently away with smooth deceleration
          this.x -= Math.cos(angle) * force * 1.5;
          this.y -= Math.sin(angle) * force * 1.5;
        }
      }

      // Recycle when off-screen
      if (this.y < -25 || this.x < -30 || this.x > width + 30) {
        this.reset(false);
      }
    }

    draw() {
      const { r, g, b } = this.color;

      if (this.type === 1) {
        // ---- 4-POINT DIAMOND STAR FLARE (✦) ----
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const flareSize = this.size * 2.8;
        const armLength = flareSize * 2.5;

        // Core soft halo
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, flareSize * 1.8);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.alpha * 0.75})`);
        grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${this.alpha * 0.2})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, flareSize * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // 4-Point cross rays
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.alpha * 0.9})`;
        ctx.beginPath();
        // Horizontal ray
        ctx.moveTo(-armLength, 0);
        ctx.quadraticCurveTo(0, -this.size * 0.5, armLength, 0);
        ctx.quadraticCurveTo(0, this.size * 0.5, -armLength, 0);
        // Vertical ray
        ctx.moveTo(0, -armLength);
        ctx.quadraticCurveTo(-this.size * 0.5, 0, 0, armLength);
        ctx.quadraticCurveTo(this.size * 0.5, 0, 0, -armLength);
        ctx.fill();

        // Bright sparkling white center
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.75, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

      } else if (this.type === 2) {
        // ---- FOREGROUND LUMINOUS BOKEH ORB ----
        const glowRadius = this.size * 4.2;
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, glowRadius
        );
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.alpha * 0.5})`);
        gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${this.alpha * 0.18})`);
        gradient.addColorStop(0.7, `rgba(202, 138, 4, ${this.alpha * 0.05})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.alpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // ---- CLASSIC GOLDEN STAR DOT ----
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ==========================================================================
  // 2. GOLDEN SHOOTING COMETS / METEORS (CELESTIAL TRAILS)
  // ==========================================================================
  class GoldenShootingStar {
    constructor() {
      this.active = false;
    }

    spawn() {
      this.active = true;
      // Start near top or sides
      this.x = Math.random() * (width * 0.8) + width * 0.1;
      this.y = Math.random() * (height * 0.4);
      
      // Speed & angle (downwards & rightwards slant ~35-45 deg)
      const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.25;
      const speed = Math.random() * 8 + 9; // fast luminous streak
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;

      this.length = Math.random() * 120 + 90; // length of glowing tail
      this.life = 0;
      this.maxLife = Math.random() * 40 + 35; // frames to live
      this.alpha = 1;
      this.thickness = Math.random() * 1.8 + 1.2;
    }

    update() {
      if (!this.active) return;
      this.x += this.vx;
      this.y += this.vy;
      this.life++;

      // Fade out towards end of lifespan
      this.alpha = 1 - (this.life / this.maxLife);

      if (this.life >= this.maxLife || this.x > width + 100 || this.y > height + 100) {
        this.active = false;
      }
    }

    draw() {
      if (!this.active || this.alpha <= 0) return;

      const tailX = this.x - this.vx * (this.length / 10);
      const tailY = this.y - this.vy * (this.length / 10);

      // Gradient tail: fading from head (bright gold/white) to tail (transparent gold)
      const grad = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255, 255, 255, ${this.alpha * 0.95})`);
      grad.addColorStop(0.15, `rgba(254, 240, 138, ${this.alpha * 0.8})`);
      grad.addColorStop(0.55, `rgba(234, 179, 8, ${this.alpha * 0.35})`);
      grad.addColorStop(1, 'rgba(202, 138, 4, 0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = this.thickness;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      // Bright comet head sparkle
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.thickness * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ==========================================================================
  // 3. MOUSE INTERACTION SPARKLES & RIPPLES
  // ==========================================================================
  class CursorSparkle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1.8 + 0.6;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 0.4;
      this.size = Math.random() * 2.2 + 1.0;
      this.life = 0;
      this.maxLife = Math.random() * 25 + 20;
      this.color = GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)];
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.96;
      this.vy *= 0.96;
      this.life++;
    }

    draw() {
      const progress = this.life / this.maxLife;
      const alpha = (1 - progress) * 0.85;
      const { r, g, b } = this.color;

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * (1 - progress * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Active collections
  let particles = [];
  let shootingStars = [new GoldenShootingStar(), new GoldenShootingStar()];
  let cursorSparkles = [];
  let nextCometTimer = 180; // frames until next shooting star

  const initParticles = () => {
    particles = [];
    const count = getParticleCount();
    for (let i = 0; i < count; i++) {
      particles.push(new GoldenParticle());
    }
  };

  // Draw delicate golden constellation laser webs between nearby particles
  const drawConstellationLines = () => {
    const maxDist = 115;
    const len = particles.length;

    for (let i = 0; i < len; i++) {
      // Only midground and foreground particles connect for cleaner aesthetics
      if (particles[i].layer === 1) continue;

      for (let j = i + 1; j < len; j++) {
        if (particles[j].layer === 1) continue;

        const p1 = particles[i];
        const p2 = particles[j];

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const strength = (1 - dist / maxDist);
          const lineAlpha = strength * Math.min(p1.alpha, p2.alpha) * 0.26;

          // Golden laser gradient
          ctx.strokeStyle = `rgba(234, 179, 8, ${lineAlpha})`;
          ctx.lineWidth = strength * 1.1;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }
  };

  // Main animation loop
  let animationFrameId = null;
  let isTabActive = true;

  const animate = () => {
    if (!isTabActive) return;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw connecting constellation lines
    drawConstellationLines();

    // 2. Update and draw golden particles (stars, dust, diamond flares)
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }

    // 3. Update & draw cursor sparkles
    for (let i = cursorSparkles.length - 1; i >= 0; i--) {
      const s = cursorSparkles[i];
      s.update();
      s.draw();
      if (s.life >= s.maxLife) {
        cursorSparkles.splice(i, 1);
      }
    }

    // 4. Update & draw shooting stars / comets
    nextCometTimer--;
    if (nextCometTimer <= 0) {
      // Spawn comet
      const freeComet = shootingStars.find(c => !c.active);
      if (freeComet) {
        freeComet.spawn();
      }
      // Set next comet interval: random between 220 and 420 frames (~3.5 to 7 seconds)
      nextCometTimer = Math.floor(Math.random() * 200 + 220);
    }

    for (let i = 0; i < shootingStars.length; i++) {
      if (shootingStars[i].active) {
        shootingStars[i].update();
        shootingStars[i].draw();
      }
    }

    animationFrameId = requestAnimationFrame(animate);
  };

  // Resize handler
  let resizeTimeout;
  const onResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    }, 150);
  };

  window.addEventListener('resize', onResize, { passive: true });

  // Mouse interaction handlers
  window.addEventListener('mousemove', (e) => {
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;

    // Spawn tiny golden stardust trail on movement
    const distMoved = Math.hypot(mouse.x - mouse.prevX, mouse.y - mouse.prevY);
    if (distMoved > 8 && cursorSparkles.length < 35) {
      cursorSparkles.push(new CursorSparkle(mouse.x, mouse.y));
    }
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    mouse.active = false;
  }, { passive: true });

  // Click burst interaction
  window.addEventListener('click', (e) => {
    // Generate subtle radial cluster of golden micro-sparks on click
    for (let i = 0; i < 8; i++) {
      cursorSparkles.push(new CursorSparkle(e.clientX, e.clientY));
    }
  }, { passive: true });

  // Tab visibility: pause on tab blur for 0% CPU usage
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isTabActive = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    } else {
      isTabActive = true;
      animate();
    }
  });

  // Start animation
  initParticles();
  animate();
})();
