import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Bot, Pin, Sparkles, Users2, LayoutGrid } from 'lucide-react';

// Three pinned notecards - the things people notice first about Presento.
// Each uses one of Presento's own accent tokens instead of a borrowed palette.
const POINTS = [
  {
    number: '01',
    title: 'AI drafts your deck',
    desc: 'Describe your session and Presento builds a full, editable slide deck in seconds - no blank page to stare at.',
    icon: Sparkles,
    accent: 'sky',
    rotate: -4,
    position: 'md:top-2 md:left-0',
  },
  {
    number: '02',
    title: 'Everyone takes part',
    desc: 'Live polls, quizzes and Q&A turn viewers into active participants in real time.',
    icon: Users2,
    accent: 'purple',
    rotate: 3,
    position: 'md:top-[260px] md:right-0',
  },
  {
    number: '03',
    title: 'One home, any scale',
    desc: 'From a single presenter to a campus-wide rollout, every session runs from the same dashboard.',
    icon: LayoutGrid,
    accent: 'teal',
    rotate: -2,
    position: 'md:top-[520px] md:left-10',
  },
];

const ACCENTS = {
  sky: { text: 'text-accent-sky', tint: 'bg-accent-sky/10', pin: 'text-accent-sky' },
  purple: { text: 'text-accent-purple-deep', tint: 'bg-accent-purple/15', pin: 'text-accent-purple-deep' },
  teal: { text: 'text-accent-teal', tint: 'bg-accent-teal/10', pin: 'text-accent-teal' },
};

function PinCard({ point, index }) {
  const Icon = point.icon;
  const c = ACCENTS[point.accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0, rotate: point.rotate }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: index * 0.12, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ rotate: 0, scale: 1.03, y: -4 }}
      className={`relative w-full md:absolute md:w-72 ${point.position} bg-surface rounded-3xl border border-hairline shadow-[var(--shadow-level-2)] p-2.5`}
    >
      {/* Pushpin */}
      <div className="flex justify-center -mt-1 mb-1">
        <Pin className={`w-5 h-5 rotate-45 ${c.pin}`} fill="currentColor" />
      </div>

      {/* Tinted content panel */}
      <div className={`rounded-[20px] ${c.tint} px-5 sm:px-6 py-5 sm:py-6`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-2xl sm:text-3xl font-extrabold ${c.text}`}>{point.number}</span>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        <h3 className="text-lg sm:text-xl font-extrabold text-ink mb-2">{point.title}</h3>
        <p className="text-sm text-ink-muted leading-relaxed">{point.desc}</p>
      </div>
    </motion.div>
  );
}

export default function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section id="features" className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="text-center mb-16 sm:mb-20 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-sky/10 text-accent-sky font-bold text-xs sm:text-sm border border-accent-sky/20 mb-6"
        >
          <Bot className="w-4 h-4 text-accent-sky animate-pulse" />
          <span>Platform Advantage</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.1, animation: 'linear' }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-9 tracking-tight text-ink"
          dangerouslySetInnerHTML={{ __html: t('landing.what_makes_unique', { brandName: t('navbar.brand_name') }) }}
        />
        <p className="text-base sm:text-lg text-ink-muted">
          Three things people notice the moment they run their first session.
        </p>
      </div>

      {/* Pinboard */}
      <div className="relative max-w-4xl mx-auto">
        {/* Lined-paper backdrop, rounded + clipped on its own layer so it
            never clips the cards themselves even if content runs long */}
        <div
          className="absolute inset-0 -mt-10 -ml-5 -mr-5 rounded-[30px] border border-hairline bg-canvas-soft overflow-hidden pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, transparent, transparent 31px, var(--color-hairline) 32px)',
          }}
        />

        {/* Dashed connectors between the pins (desktop only) */}
        <svg
          className="hidden md:block absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 700 900"
          preserveAspectRatio="none"
        >
          <path d="M260 170 L440 290" stroke="var(--color-accent-sky)" strokeWidth="2" strokeDasharray="6 6" opacity="0.45" fill="none" />
          <path d="M440 460 L260 560" stroke="var(--color-accent-teal)" strokeWidth="2" strokeDasharray="6 6" opacity="0.45" fill="none" />
        </svg>

        <div className="relative flex flex-col gap-10 md:block md:h-[900px] px-6 sm:px-10 py-14">
          {POINTS.map((point, index) => (
            <PinCard key={point.number} point={point} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
