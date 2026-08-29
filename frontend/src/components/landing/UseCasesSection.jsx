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
  Globe2
} from 'lucide-react';

// Feature-by-feature breakdown of what an individual host gets vs. what an
// organization/institution unlocks - rendered as report-style comparison rows.
const COMPARISON_ROWS = [
  { label: 'Live Polls, Quizzes & Q&A', individual: true, organization: true },
  { label: 'AI-Powered Slide Generation', individual: true, organization: true },
  { label: 'Free Forever Tier', individual: true, organization: false },
  { label: 'Custom Domain & Branding', individual: false, organization: true },
  { label: 'Centralized Admin Portal', individual: false, organization: true },
  { label: 'Dedicated Support & SLA', individual: false, organization: true },
];

function StatusPill({ included, color }) {
  if (!included) {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-canvas-soft text-ink-muted text-[11px] sm:text-xs font-semibold border border-hairline">
        Not included
      </span>
    );
  }

  const styles = color === 'teal'
    ? 'bg-accent-teal/10 text-accent-teal border-accent-teal/20'
    : 'bg-accent-sky/10 text-accent-sky border-accent-sky/20';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold border ${styles}`}>
      <CheckCircle2 className="w-3.5 h-3.5" />
      Included
    </span>
  );
}

export default function UseCasesSection() {
  const navigate = useNavigate();
  // eslint-disable-next-line
  const { t } = useTranslation();

  return (
    <section id="use-cases" className="py-20 sm:py-28 bg-canvas relative overflow-hidden">
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
            Compare Individual vs Organization Plans
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg text-ink-muted max-w-xl mx-auto"
          >
            See exactly what's included for a solo host versus a full team or campus rollout.
          </motion.p>
        </div>

        {/* Report-Style Comparison Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto bg-surface border border-hairline/80 rounded-[28px] shadow-[var(--shadow-level-1)] overflow-hidden"
        >
          {/* Header bar */}
          <div className="relative flex items-stretch bg-ink text-white">
            <div className="flex-1 flex items-center gap-2.5 px-6 sm:px-8 py-5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-sky animate-pulse" />
              <span className="font-extrabold tracking-wide text-sm sm:text-base">PLAN COMPARISON</span>
            </div>
            <div className="w-px bg-white/15" />
            <div className="flex-1 flex items-center justify-end px-6 sm:px-8 py-5">
              <span className="text-white/70 font-semibold text-sm sm:text-base text-right">
                Individuals vs Organizations
              </span>
            </div>
          </div>

          {/* Column headers */}
          <div className="flex items-center px-6 sm:px-8 py-3.5 border-b border-hairline bg-canvas-soft/60">
            <div className="flex-1" />
            <div className="w-24 sm:w-36 flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-bold text-ink-muted uppercase tracking-wide">
              <Users className="w-3.5 h-3.5 text-accent-sky" />
              <span>Individual</span>
            </div>
            <div className="w-24 sm:w-36 flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-bold text-ink-muted uppercase tracking-wide">
              <Building2 className="w-3.5 h-3.5 text-accent-teal" />
              <span>Organization</span>
            </div>
          </div>

          {/* Rows */}
          {COMPARISON_ROWS.map((row, idx) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06, duration: 0.4 }}
              className="flex items-center px-6 sm:px-8 py-4 sm:py-5 border-b border-hairline last:border-b-0 hover:bg-canvas-soft/40 transition-colors"
            >
              <div className="flex-1 font-semibold text-sm sm:text-base text-ink pr-3">
                {row.label}
              </div>
              <div className="w-24 sm:w-36 flex justify-center">
                <StatusPill included={row.individual} color="sky" />
              </div>
              <div className="w-24 sm:w-36 flex justify-center">
                <StatusPill included={row.organization} color="teal" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <button
            onClick={() => navigate('/register')}
            className="w-full sm:w-auto px-10 py-4 rounded-full bg-ink text-white font-extrabold text-base hover:bg-black/80 transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <span>Start Presenting Free</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/institution/register')}
            className="w-full sm:w-auto px-10 py-4 rounded-full bg-surface border border-hairline hover:bg-canvas-soft text-ink font-extrabold text-base transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <span>Explore Institution Plan</span>
            <ArrowRight className="w-5 h-5 text-primary" />
          </button>
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
