import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles, BarChart2, Globe, TrendingUp } from 'lucide-react';

export default function AboutSection() {
  const { t } = useTranslation();

  const items = [
    { 
      title: t('landing.engage'), 
      desc: t('landing.engage_desc'), 
      color: "text-accent-sky",
      badge: "01 / ENGAGE",
      bgGradient: "from-accent-sky/10 via-surface to-surface",
      borderColor: "border-accent-sky/25 hover:border-accent-sky/50",
      icon: <BarChart2 className="w-6 h-6 text-accent-sky" />
    },
    { 
      title: t('landing.connect'), 
      desc: t('landing.connect_desc'), 
      color: "text-accent-teal",
      badge: "02 / CONNECT",
      bgGradient: "from-accent-teal/10 via-surface to-surface",
      borderColor: "border-accent-teal/25 hover:border-accent-teal/50",
      icon: <Globe className="w-6 h-6 text-accent-teal" />
    },
    { 
      title: t('landing.evolve'), 
      desc: t('landing.evolve_desc'), 
      color: "text-accent-orange",
      badge: "03 / EVOLVE",
      bgGradient: "from-accent-orange/10 via-surface to-surface",
      borderColor: "border-accent-orange/25 hover:border-accent-orange/50",
      icon: <TrendingUp className="w-6 h-6 text-accent-orange" />
    }
  ];

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
          className="text-lg sm:text-xl text-ink-muted leading-relaxed mb-14 max-w-3xl mx-auto"
        >
          {t('landing.about_description')}
        </motion.p>

        {/* 3 Pillar Cards */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 text-left">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              whileHover={{ y: -6 }}
              className={`bg-gradient-to-b ${item.bgGradient} border ${item.borderColor} p-8 rounded-2xl shadow-[var(--shadow-level-1)] hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between group`}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-surface border border-hairline flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-md bg-canvas-soft text-ink-muted border border-hairline">
                    {item.badge}
                  </span>
                </div>

                <h3 className={`text-2xl font-bold mb-3 ${item.color} tracking-tight`}>
                  {item.title}
                </h3>
                <p className="text-ink-muted text-sm sm:text-base leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-hairline/60 flex items-center justify-between text-xs text-ink-faint group-hover:text-ink-secondary transition-colors">
                <span>Interactive Mode</span>
                <span className="font-bold">&rarr;</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
