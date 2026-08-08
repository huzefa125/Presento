import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  Building2, 
  GraduationCap, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Globe2 
} from 'lucide-react';

function DotParticleCanvas({ hoveredCard }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.offsetWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
      initDots();
    };

    window.addEventListener('resize', handleResize);

    const spacing = 20;
    let dots = [];
    const mouse = { x: -1000, y: -1000, radius: 160 };

    const initDots = () => {
      dots = [];
      const cols = Math.floor(width / spacing);
      const rows = Math.floor(height / spacing);
      const offsetX = (width - cols * spacing) / 2;
      const offsetY = (height - rows * spacing) / 2;

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          dots.push({
            x: offsetX + i * spacing,
            y: offsetY + j * spacing,
            baseX: offsetX + i * spacing,
            baseY: offsetY + j * spacing,
            vx: 0,
            vy: 0,
            radius: 1.4,
            targetRadius: 1.4,
            color: '#615d59',
            alpha: 0.28,
            targetAlpha: 0.28
          });
        }
      }
    };

    initDots();

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const parent = canvas.parentElement;
    parent.addEventListener('mousemove', handleMouseMove);
    parent.addEventListener('mouseleave', handleMouseLeave);

    let time = 0;

    const render = () => {
      time += 0.03;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // Calculate distance to mouse cursor
        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          
          // Repulsion displacement force
          const pushX = Math.cos(angle) * force * -18;
          const pushY = Math.sin(angle) * force * -18;

          dot.vx += (dot.baseX + pushX - dot.x) * 0.22;
          dot.vy += (dot.baseY + pushY - dot.y) * 0.22;

          dot.targetRadius = 1.4 + force * 3.2;
          dot.targetAlpha = 0.45 + force * 0.55;
          dot.color = hoveredCard === 'orgs' ? '#0d9488' : '#0075de';
        } else {
          // Idle wave effect
          const idleWave = Math.sin(time + dot.baseX * 0.025 + dot.baseY * 0.025) * 0.06;
          dot.vx += (dot.baseX - dot.x) * 0.12;
          dot.vy += (dot.baseY - dot.y) * 0.12;
          dot.targetRadius = 1.4;
          dot.targetAlpha = 0.26 + idleWave;
          dot.color = '#615d59';
        }

        // Apply friction
        dot.vx *= 0.82;
        dot.vy *= 0.82;
        dot.x += dot.vx;
        dot.y += dot.vy;

        // Smooth transition
        dot.radius += (dot.targetRadius - dot.radius) * 0.18;
        dot.alpha += (dot.targetAlpha - dot.alpha) * 0.18;

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = dot.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, dot.alpha));
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove);
        parent.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [hoveredCard]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-20" 
    />
  );
}

export default function UseCasesSection() {
  const navigate = useNavigate();
  // eslint-disable-next-line
  const { t } = useTranslation();
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <section id="use-cases" className="py-20 sm:py-28 bg-canvas relative overflow-hidden">
      {/* Interactive Dot Particle Canvas Overlay (z-20 pointer-events-none) */}
      <DotParticleCanvas hoveredCard={hoveredCard} />

      {/* Radial Background Glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-accent-sky/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-accent-teal/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs sm:text-sm border border-primary/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span>Built for Every Space</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-ink tracking-tight leading-tight mb-4"
          >
            Designed for Individuals & Organizations
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg text-ink-muted max-w-xl mx-auto"
          >
            Whether hosting an individual presentation or rolling out interactive tools campus-wide.
          </motion.p>
        </div>

        {/* Dual Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* LEFT CARD: For Creators & Educators */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            onMouseEnter={() => setHoveredCard('creators')}
            onMouseLeave={() => setHoveredCard(null)}
            className="bg-surface/75 backdrop-blur-sm border border-hairline/80 rounded-[28px] p-8 sm:p-12 shadow-[var(--shadow-level-1)] hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden group hover:border-accent-sky/60 hover:bg-surface/90"
          >
            {/* Top Pill Tag */}
            <div className="flex items-center justify-between mb-8">
              <span className="px-4 py-1.5 rounded-full bg-canvas-soft border border-hairline text-xs font-semibold text-ink-secondary">
                Available at no charge
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-accent-sky animate-pulse" />
            </div>

            {/* Central Content */}
            <div className="text-center my-4">
              {/* Interactive Particle Brackets & Logo Graphic */}
              <div className="relative w-48 h-36 mx-auto mb-8 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <svg className="w-full h-full text-accent-sky" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Left Bracket Animated Dots */}
                  <path d="M50 20C30 20 20 30 20 50V60C20 65 15 70 5 70C15 70 20 75 20 80V90C20 110 30 120 50 120" stroke="currentColor" strokeWidth="3" strokeDasharray="3 4" strokeLinecap="round" opacity="0.85" />
                  {/* Right Bracket Animated Dots */}
                  <path d="M150 20C170 20 180 30 180 50V60C180 65 185 70 195 70C185 70 180 75 180 80V90C180 110 170 120 150 120" stroke="currentColor" strokeWidth="3" strokeDasharray="3 4" strokeLinecap="round" opacity="0.85" />
                  {/* Inner Presento Logo Badge */}
                  <rect x="75" y="40" width="50" height="60" rx="14" fill="#0075de" className="group-hover:fill-[#005bab] transition-colors" />
                  <text x="100" y="78" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="sans-serif">𝑖</text>
                </svg>
              </div>

              <h3 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight mb-3">
                For Developers & Creators
              </h3>
              
              <p className="text-xl sm:text-2xl font-semibold text-primary mb-6">
                Achieve new heights
              </p>

              <p className="text-sm sm:text-base text-ink-muted leading-relaxed max-w-md mx-auto mb-8">
                Build interactive slides in seconds, launch instant live polls, and turn passive audiences into active participants.
              </p>

              {/* Feature Points */}
              <div className="flex flex-wrap justify-center gap-2.5 mb-10">
                {['Free Forever Tier', 'Instant AI Deck Builder', 'Live Q&A & Polls'].map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent-sky/10 text-accent-sky text-xs font-bold border border-accent-sky/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="text-center pt-6 border-t border-hairline">
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-10 py-4 rounded-full bg-ink text-white font-extrabold text-base hover:bg-black/80 transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <span>Start Presenting Free</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* RIGHT CARD: For Institutions & Teams */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            onMouseEnter={() => setHoveredCard('orgs')}
            onMouseLeave={() => setHoveredCard(null)}
            className="bg-surface/75 backdrop-blur-sm border border-hairline/80 rounded-[28px] p-8 sm:p-12 shadow-[var(--shadow-level-1)] hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden group hover:border-accent-teal/60 hover:bg-surface/90"
          >
            {/* Top Pill Tag */}
            <div className="flex items-center justify-between mb-8">
              <span className="px-4 py-1.5 rounded-full bg-accent-teal/15 text-accent-teal text-xs font-extrabold border border-accent-teal/30">
                Now Available!
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-accent-teal animate-pulse" />
            </div>

            {/* Central Content */}
            <div className="text-center my-4">
              {/* Interactive Network Dots & Graphic */}
              <div className="relative w-48 h-36 mx-auto mb-8 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <svg className="w-full h-full text-accent-teal" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Outer Particle Grid Frame */}
                  <rect x="25" y="20" width="150" height="100" rx="18" stroke="currentColor" strokeWidth="3" strokeDasharray="4 5" opacity="0.7" />
                  {/* Institutional Network Nodes */}
                  <circle cx="60" cy="50" r="11" fill="#2a9d99" opacity="0.85" className="group-hover:scale-125 transition-transform" />
                  <circle cx="140" cy="50" r="11" fill="#2a9d99" opacity="0.85" className="group-hover:scale-125 transition-transform" />
                  <circle cx="100" cy="92" r="15" fill="#213183" />
                  <line x1="60" y1="50" x2="100" y2="92" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                  <line x1="140" y1="50" x2="100" y2="92" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                  <text x="100" y="97" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">HQ</text>
                </svg>
              </div>

              <h3 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight mb-3">
                For Organizations
              </h3>
              
              <p className="text-xl sm:text-2xl font-semibold text-secondary mb-6">
                Level up your entire team
              </p>

              <p className="text-sm sm:text-base text-ink-muted leading-relaxed max-w-md mx-auto mb-8">
                Empower your university or enterprise with centralized admin controls, custom domain branding, and campus-wide licensing.
              </p>

              {/* Feature Points */}
              <div className="flex flex-wrap justify-center gap-2.5 mb-10">
                {['Campus Admin Portal', 'Custom Brand & Domain', 'Dedicated Support & SLA'].map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent-teal/10 text-accent-teal text-xs font-bold border border-accent-teal/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="text-center pt-6 border-t border-hairline">
              <button
                onClick={() => navigate('/institution/register')}
                className="w-full sm:w-auto px-10 py-4 rounded-full bg-surface border border-hairline hover:bg-canvas-soft text-ink font-extrabold text-base transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <span>Explore Institution Plan</span>
                <ArrowRight className="w-5 h-5 text-primary" />
              </button>
            </div>
          </motion.div>

        </div>

        {/* 4 Quick Category Badges at bottom */}
        <div className="mt-16 pt-10 border-t border-hairline/60 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold text-ink-muted relative z-20">
          <span className="text-ink font-bold">Supported Spaces:</span>
          <span className="px-4 py-2 rounded-xl bg-surface/90 backdrop-blur-sm border border-hairline shadow-sm flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-accent-sky" /> Universities & Schools
          </span>
          <span className="px-4 py-2 rounded-xl bg-surface/90 backdrop-blur-sm border border-hairline shadow-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-accent-teal" /> Corporate & Town Halls
          </span>
          <span className="px-4 py-2 rounded-xl bg-surface/90 backdrop-blur-sm border border-hairline shadow-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-accent-orange" /> Communities & Civic
          </span>
          <span className="px-4 py-2 rounded-xl bg-surface/90 backdrop-blur-sm border border-hairline shadow-sm flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-purple-500" /> Keynotes & Conferences
          </span>
        </div>

      </div>
    </section>
  );
}
