import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Bot, BarChart2, Globe, TrendingUp } from 'lucide-react';

export default function FeaturesSection() {
  const { t } = useTranslation();

  const features = [
    {
      icon: <BarChart2 className="w-6 h-6 text-accent-sky" />,
      title: "interactive_engagement",
      tag: "Live Polling & Q&A",
      bgGradient: "from-accent-sky/10 via-surface to-surface",
      borderColor: "border-accent-sky/30 hover:border-accent-sky/60",
      accentBar: "bg-accent-sky",
      badgeColor: "bg-accent-sky/15 text-accent-sky",
      bullets: ["Live Polls & Word Clouds", "Interactive Q&A & Upvoting"]
    },
    {
      icon: <Globe className="w-6 h-6 text-accent-orange" />,
      title: "community_connection",
      tag: "Global Reach",
      bgGradient: "from-accent-orange/10 via-surface to-surface",
      borderColor: "border-accent-orange/30 hover:border-accent-orange/60",
      accentBar: "bg-accent-orange",
      badgeColor: "bg-accent-orange/15 text-accent-orange",
      bullets: ["Classrooms & Town Halls", "Diaspora & Global Events"]
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-purple-500" />,
      title: "growth_insights",
      tag: "Deep Analytics",
      bgGradient: "from-purple-500/10 via-surface to-surface",
      borderColor: "border-purple-500/30 hover:border-purple-500/60",
      accentBar: "bg-purple-500",
      badgeColor: "bg-purple-500/15 text-purple-500",
      bullets: ["Real-time Participant Metrics", "Exportable AI Reports"]
    },
    {
      icon: <Bot className="w-6 h-6 text-accent-teal" />,
      title: "ai_assistance",
      tag: "Smart Copilot",
      bgGradient: "from-accent-teal/10 via-surface to-surface",
      borderColor: "border-accent-teal/30 hover:border-accent-teal/60",
      accentBar: "bg-accent-teal",
      badgeColor: "bg-accent-teal/15 text-accent-teal",
      bullets: ["Instant AI Deck Creation", "Smart Prompts & Summaries"]
    },
  ];

  return (
    <section id="features" className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="text-center mb-16 max-w-3xl mx-auto">
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
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-ink"
          dangerouslySetInnerHTML={{ __html: t('landing.what_makes_unique', { brandName: t('navbar.brand_name') }) }}
        />
        <p className="text-base sm:text-lg text-ink-muted">
          Built from the ground up to redefine how audiences and presenters connect in real-time.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -6 }}
            className={`p-8 rounded-2xl bg-gradient-to-b ${feature.bgGradient} border ${feature.borderColor} shadow-[var(--shadow-level-1)] hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden`}
          >
            {/* Top Accent Bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${feature.accentBar}`} />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-surface border border-hairline flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${feature.badgeColor}`}>
                  {feature.tag}
                </span>
              </div>

              <h3 className="text-xl font-bold mb-3 text-ink group-hover:text-primary transition-colors tracking-tight">
                {t(`landing.${feature.title.toLowerCase().replace(/\s+/g, '_')}`)}
              </h3>
              <p className="text-ink-muted leading-relaxed text-sm mb-6">
                {t(`landing.${feature.title.toLowerCase().replace(/\s+/g, '_')}_desc`)}
              </p>
            </div>

            {/* Feature Bullet Highlights */}
            <div className="pt-4 border-t border-hairline/60 space-y-2">
              {feature.bullets.map((bullet, bIdx) => (
                <div key={bIdx} className="flex items-center gap-2 text-xs font-medium text-ink-secondary">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
