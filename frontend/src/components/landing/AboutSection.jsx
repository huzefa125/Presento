import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { CompareReveal } from '../ui/compare-reveal';

// Static, monochrome "before" scene - a traditional slide nobody remembers.
function StaticSlideScene() {
  return (
    <div className="h-full w-full bg-[#f3f2f0]">
      <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <rect width="640" height="400" fill="#f3f2f0" />
        <rect x="60" y="70" width="230" height="18" rx="3" fill="#4b4945" />
        <rect x="60" y="140" width="420" height="10" rx="2" fill="#b9b6b0" />
        <rect x="60" y="166" width="380" height="10" rx="2" fill="#b9b6b0" />
        <rect x="60" y="192" width="400" height="10" rx="2" fill="#b9b6b0" />
        <rect x="60" y="218" width="300" height="10" rx="2" fill="#b9b6b0" />
        <circle cx="72" cy="145" r="3" fill="#8a8781" />
        <circle cx="72" cy="171" r="3" fill="#8a8781" />
        <circle cx="72" cy="197" r="3" fill="#8a8781" />
        <circle cx="72" cy="223" r="3" fill="#8a8781" />
        <rect x="60" y="290" width="120" height="34" rx="6" fill="#dedbd4" />
        <text x="120" y="311" textAnchor="middle" fontFamily="sans-serif" fontSize="12" fill="#6b6862">Next slide</text>
      </svg>
    </div>
  );
}

// Live, colorful "after" scene - a Presento session mid-poll.
function InteractiveSessionScene() {
  const bars = [62, 88, 44, 70];
  const colors = ['#62aef0', '#dd5b00', '#2a9d99', '#391c57'];
  return (
    <div className="h-full w-full" style={{ background: 'linear-gradient(160deg, #0075de 0%, #213183 100%)' }}>
      <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <circle cx="580" cy="60" r="6" fill="#ff64c8">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
        </circle>
        <text x="595" y="65" fontFamily="sans-serif" fontSize="13" fontWeight="700" fill="#ffffff">LIVE</text>
        <rect x="60" y="60" width="260" height="18" rx="3" fill="#ffffff" />
        <text x="60" y="105" fontFamily="sans-serif" fontSize="13" fill="#c9dcfb">Which tool should we ship next?</text>

        {bars.map((h, i) => {
          const x = 60 + i * 90;
          const barH = h * 1.6;
          const y = 330 - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width="60" height={barH} rx="8" fill={colors[i]} opacity="0.95" />
              <text x={x + 30} y={y - 10} textAnchor="middle" fontFamily="sans-serif" fontSize="14" fontWeight="700" fill="#ffffff">
                {h}%
              </text>
            </g>
          );
        })}
        <rect x="60" y="345" width="500" height="1" fill="rgba(255,255,255,0.25)" />
        <text x="60" y="372" fontFamily="sans-serif" fontSize="12" fill="#c9dcfb">248 responses · updating in real time</text>
      </svg>
    </div>
  );
}

export default function AboutSection() {
  const { t } = useTranslation();

  return (
    <section id="about" className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-transparent via-accent-sky/5 to-transparent -z-10 pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center">
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs sm:text-sm border border-primary/20 mb-6"
        >
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span>Core Philosophy</span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 tracking-tight leading-tight text-ink"
          dangerouslySetInnerHTML={{ __html: t('landing.the_nexus_of_people_technology_progress') }}
        />

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg sm:text-xl text-ink-muted leading-relaxed mb-12 max-w-3xl mx-auto"
        >
          {t('landing.about_description')}
        </motion.p>

        {/* Drag-to-reveal: static slide vs. a live Presento session */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="max-w-2xl mx-auto mb-6"
        >
          <CompareReveal
            className="shadow-[var(--shadow-level-2)]"
            before={<StaticSlideScene />}
            after={<InteractiveSessionScene />}
            labels={['Static Slides', 'Interactive Session']}
            defaultPosition={50}
            introSweep
            snapOnDoubleClick={50}
          />
        </motion.div>
        <p className="text-xs sm:text-sm text-ink-faint">Drag the handle - or press ← / → - to compare.</p>
      </div>
    </section>
  );
}
