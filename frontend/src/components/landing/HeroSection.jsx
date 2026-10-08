import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { JoinPresentationBtn } from '../common/JoinPresentationDialog';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

/**
 * Landing page hero. Split out of Landing.jsx; see CODE_STANDARDS.md.
 *
 * typewriterText and platformUserCount stay owned by Landing (they're
 * updated by its typewriter effect and its platform-user-count socket
 * subscription), and setShowJoinDialog opens the modal Landing itself
 * renders - everything else this section needs (scroll-linked parallax,
 * its own animation variants) is fully self-contained.
 */
export default function HeroSection({ typewriterText, platformUserCount, setShowJoinDialog }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);

  return (
        <section className="container mx-auto px-6 mb-32">
          <div className="flex flex-col lg:flex-row items-center gap-16 bg-secondary text-on-primary rounded-2xl px-6 py-12 md:px-16 md:py-20">
            <motion.div
              className="lg:w-[60%] text-center lg:text-left"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8">
                <span className="flex h-2 w-2 rounded-full bg-accent-teal animate-pulse"></span>
                <span className="text-sm font-medium text-on-primary/90">{t('landing.interactive_engagement_platform')}</span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-bold leading-tight mb-6 tracking-[-0.03em]">
                <div className="text-on-primary md:leading-24 leading-16">
                  <div className="min-h-[1.2em]">
                    {typewriterText}
                    <span className="animate-pulse">|</span>
                  </div>
                </div>
                <div className="md:mt-4 mt-0 text-4xl lg:text-6xl">
                  {t('landing.with_inavora', { brandName: t('navbar.brand_name') })}
                </div>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-xl text-on-primary/70 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {t('landing.hero_subtitle')}
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <JoinPresentationBtn onClick={setShowJoinDialog} />
                <button
                  onClick={() => navigate('/how-it-works')}
                  className="w-full sm:w-auto sm:max-w-none px-8 py-4 rounded-full bg-surface text-ink font-bold text-lg hover:bg-canvas-soft transition-all flex items-center justify-center gap-2 shadow-[var(--shadow-level-1)]"
                >
                  {t('landing.see_how_it_works')}
                </button>
              </motion.div>
            </motion.div>

            <motion.div
              className="lg:w-[40%] relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div style={{ y: y1 }} className="absolute top-0 right-0 w-64 h-64 bg-accent-sky/20 rounded-full blur-3xl" />
              <motion.div style={{ y: y2 }} className="absolute bottom-0 left-0 w-64 h-64 bg-accent-teal/20 rounded-full blur-3xl" />

              {/* Abstract UI Mockup */}
              <div className="relative z-10 bg-surface border border-hairline rounded-xl p-6 shadow-[var(--shadow-level-2)] transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-canvas-soft text-xs font-mono text-ink-muted border border-hairline">{t('landing.live_session')}</div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl md:text-2xl font-bold text-center mb-6 text-ink">
                    {t('landing.how_do_you_prefer_to_engage')}
                  </h3>

                  {[
                    { label: t('landing.live_polls'), percent: "58%", width: "58%", color: "bg-accent-sky" },
                    { label: t('landing.qa_sessions'), percent: "24%", width: "24%", color: "bg-accent-teal" },
                    { label: t('landing.word_clouds'), percent: "18%", width: "18%", color: "bg-accent-orange" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 1 + (i * 0.2), duration: 1 }}
                      className="relative h-auto min-h-14 bg-canvas-soft rounded-lg overflow-hidden group cursor-pointer border border-hairline"
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: item.width }}
                        transition={{ delay: 1.5 + (i * 0.2), duration: 1.5, type: "spring" }}
                        className={`absolute top-0 left-0 h-full ${item.color} opacity-20 group-hover:opacity-30 transition-opacity`}
                      />
                      <div className="absolute inset-0 flex flex-row items-center justify-between p-4 gap-2">
                        <span className="font-medium text-ink-secondary text-sm md:text-base">{item.label}</span>
                        <span className="font-bold text-ink text-sm md:text-base">{item.percent}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-ink-muted">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                    <span className="text-xs sm:text-sm">
                      {platformUserCount < 10 ? t('landing.join_our_community') :
                       `${platformUserCount} ${t('landing.active_participants')}`}
                    </span>
                  </div>
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-canvas-soft border-2 border-surface flex items-center justify-center text-xs text-ink">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${i === 1 ? 'text-accent-sky' : i === 2 ? 'text-accent-teal' : 'text-accent-orange'}`} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
  );
}
