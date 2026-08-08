import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  BarChart3, 
  MessageSquare, 
  Trophy, 
  TrendingUp, 
  QrCode, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Users, 
  Globe, 
  ShieldCheck, 
  Smartphone,
  Play
} from 'lucide-react';
import { JoinPresentationDialog } from './JoinPresentationDialog';

export default function PresentoShowcase() {
  const navigate = useNavigate();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const benefits = [
    {
      id: 'ai-builder',
      title: 'AI Presentation Builder',
      badge: 'Smart & Fast',
      description: 'Transform topics into interactive presentation decks in seconds with smart AI prompts and auto-generated polls.',
      icon: <Sparkles className="w-6 h-6 text-accent-sky" />,
      bgGradient: 'from-accent-sky/10 via-surface to-surface',
      borderColor: 'border-accent-sky/20',
      tagColor: 'bg-accent-sky/15 text-accent-sky'
    },
    {
      id: 'live-polls',
      title: 'Real-time Polls & Word Clouds',
      badge: 'Instant Results',
      description: 'Collect audience responses instantly and watch results render live on screen with vibrant, dynamic charts.',
      icon: <BarChart3 className="w-6 h-6 text-[#10b981]" />,
      bgGradient: 'from-[#10b981]/10 via-surface to-surface',
      borderColor: 'border-[#10b981]/20',
      tagColor: 'bg-[#10b981]/15 text-[#10b981]'
    },
    {
      id: 'live-qa',
      title: 'Live Q&A & Upvoting',
      badge: 'Audience Voice',
      description: 'Empower quiet voices. Participants submit questions anonymously or with names, and upvote top inquiries.',
      icon: <MessageSquare className="w-6 h-6 text-accent-orange" />,
      bgGradient: 'from-accent-orange/10 via-surface to-surface',
      borderColor: 'border-accent-orange/20',
      tagColor: 'bg-accent-orange/15 text-accent-orange'
    },
    {
      id: 'gamified-quizzes',
      title: 'Gamified Quizzes & Leaderboards',
      badge: 'High Engagement',
      description: 'Turn learning into an exciting game with countdown timers, speed points, and live podium leaderboards.',
      icon: <Trophy className="w-6 h-6 text-purple-500" />,
      bgGradient: 'from-purple-500/10 via-surface to-surface',
      borderColor: 'border-purple-500/20',
      tagColor: 'bg-purple-500/15 text-purple-500'
    },
    {
      id: 'analytics',
      title: 'Deep Analytics & AI Insights',
      badge: 'Data Driven',
      description: 'Receive detailed participant engagement reports, breakdown metrics, and downloadable AI session summaries.',
      icon: <TrendingUp className="w-6 h-6 text-accent-teal" />,
      bgGradient: 'from-accent-teal/10 via-surface to-surface',
      borderColor: 'border-accent-teal/20',
      tagColor: 'bg-accent-teal/15 text-accent-teal'
    }
  ];

  const steps = [
    {
      step: '01',
      title: 'Create or AI-Generate',
      dotColor: 'bg-[#10b981]',
      description: 'Build interactive slides from scratch or convert your ideas into full presentations using Presento AI.'
    },
    {
      step: '02',
      title: 'Share Code or QR',
      dotColor: 'bg-accent-sky',
      description: 'Display a simple 6-digit session code or QR code. Audience joins instantly without downloading any app.'
    },
    {
      step: '03',
      title: 'Engage Live Audience',
      dotColor: 'bg-accent-orange',
      description: 'Trigger live polls, quizzes, and Q&A during your talk. Watch engagement jump as responses pour in.'
    },
    {
      step: '04',
      title: 'Export Insights & Report',
      dotColor: 'bg-purple-500',
      description: 'Analyze audience sentiment, review response metrics, and download complete AI summaries for your team.'
    }
  ];

  return (
    <section className="py-20 md:py-28 bg-canvas border-y border-hairline relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-accent-sky/10 via-accent-teal/10 to-accent-orange/10 blur-[130px] pointer-events-none -z-10" />

      <div className="container mx-auto px-4 sm:px-6">
        
        {/* ================= PART 1: REWARDS & BENEFITS BENTO GRID ================= */}
        <div className="mb-24">
          <div className="flex flex-col items-center text-center mb-14">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary font-bold text-sm sm:text-base border border-primary/20 mb-6"
            >
              <Zap className="w-4 h-4 text-primary animate-pulse" />
              <span>Platform Rewards & Benefits</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-ink tracking-tight max-w-3xl leading-tight"
            >
              Everything you need for unforgettable presentations
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-base sm:text-lg text-ink-muted max-w-2xl"
            >
              Turn passive listeners into active participants with smart AI tools, real-time feedback, and zero friction.
            </motion.p>
          </div>

          {/* Bento Grid Layout (Inspired by Image 1) */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            
            {/* 5 Benefits Cards (Light Gradient) */}
            {benefits.slice(0, 3).map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className={`p-7 rounded-2xl bg-gradient-to-b ${item.bgGradient} border ${item.borderColor} shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-all flex flex-col justify-between group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-surface border border-hairline flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${item.tagColor}`}>
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-ink mb-3 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-hairline/60 flex items-center gap-2 text-xs font-semibold text-ink-secondary">
                  <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                  <span>Instant Availability</span>
                </div>
              </motion.div>
            ))}

            {/* Featured Dark Bento Perks Card (Inspired by Goodies Card in Image 1) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="md:col-span-3 lg:col-span-1 lg:row-span-2 p-8 rounded-2xl bg-[#1c1d21] text-white border border-white/10 shadow-2xl flex flex-col justify-between relative overflow-hidden group"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-mono text-accent-sky mb-6 border border-white/15">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Interactive Toolkit</span>
                </div>

                <h3 className="text-2xl font-bold mb-3 tracking-tight text-white">
                  Presento Live Perks & Features
                </h3>

                <p className="text-sm text-gray-300 leading-relaxed mb-6">
                  Everything you need to deliver high-impact keynote presentations, classroom lectures, and corporate town halls.
                </p>

                {/* Feature Highlights Badges */}
                <div className="space-y-3 mb-8">
                  {[
                    { icon: <QrCode className="w-4 h-4 text-accent-sky" />, text: 'QR Code Instant Joining' },
                    { icon: <Smartphone className="w-4 h-4 text-[#10b981]" />, text: 'Zero App Download Required' },
                    { icon: <Globe className="w-4 h-4 text-accent-orange" />, text: 'Multi-Language Support (11+)' },
                    { icon: <ShieldCheck className="w-4 h-4 text-purple-400" />, text: 'Enterprise Data Security' },
                    { icon: <Users className="w-4 h-4 text-accent-teal" />, text: 'Unlimited Live Participants' }
                  ].map((perk, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-gray-200 hover:bg-white/10 transition-colors">
                      {perk.icon}
                      <span>{perk.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Interactive Trigger */}
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-3 rounded-full bg-primary hover:bg-primary-active text-on-primary font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95"
                >
                  <span>Start Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            {/* Remaining 2 Bento Cards */}
            {benefits.slice(3, 5).map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index + 3) * 0.1 }}
                whileHover={{ y: -5 }}
                className={`p-7 rounded-2xl bg-gradient-to-b ${item.bgGradient} border ${item.borderColor} shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-all flex flex-col justify-between group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-surface border border-hairline flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${item.tagColor}`}>
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-ink mb-3 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-hairline/60 flex items-center gap-2 text-xs font-semibold text-ink-secondary">
                  <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                  <span>Included in Free Plan</span>
                </div>
              </motion.div>
            ))}

            {/* Interactive Try Live Session Card */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="p-7 rounded-2xl bg-surface border border-hairline shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Play className="w-6 h-6 ml-0.5 fill-primary" />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/15 text-primary">
                    Live Demo
                  </span>
                </div>
                <h3 className="text-xl font-bold text-ink mb-3 group-hover:text-primary transition-colors">
                  Join a Live Session Now
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Have a 6-digit session code? Experience Presento from an audience perspective in real-time.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-hairline">
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="w-full py-2.5 rounded-full bg-canvas-soft hover:bg-hairline text-ink font-bold text-sm transition-all flex items-center justify-center gap-2 border border-hairline cursor-pointer"
                >
                  <span>Enter Code to Join</span>
                  <QrCode className="w-4 h-4 text-primary" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ================= PART 2: HOW IT WORKS TIMELINE ================= */}
        <div className="pt-12 border-t border-hairline">
          <div className="text-center mb-16">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight mb-4"
            >
              How Presento Works in 4 Easy Steps
            </motion.h3>
            <p className="text-ink-muted text-base sm:text-lg max-w-xl mx-auto">
              From creating your presentation deck to exporting live participant data — effortless and fast.
            </p>
          </div>

          {/* Timeline Process Line (Inspired by Image 3) */}
          <div className="relative max-w-6xl mx-auto">
            {/* Connecting Horizontal Line */}
            <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-1 bg-hairline -z-0" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
              {steps.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="flex flex-col items-center text-center group"
                >
                  {/* Step Node Marker */}
                  <div className="relative mb-6">
                    <div className="w-13 h-13 rounded-full bg-surface border-2 border-hairline flex items-center justify-center shadow-md group-hover:border-primary group-hover:scale-110 transition-all">
                      <span className={`w-4 h-4 rounded-full ${item.dotColor} shadow-sm`} />
                    </div>
                    <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-ink text-white font-mono text-[10px] font-bold">
                      {item.step}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-ink mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-xs">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Bottom CTA Button (Inspired by Image 3) */}
            <div className="mt-14 text-center">
              <button
                onClick={() => navigate('/register')}
                className="px-9 py-4 rounded-full bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-base shadow-lg hover:shadow-xl transition-all hover:scale-[1.03] active:scale-95 cursor-pointer inline-flex items-center gap-2.5"
              >
                <span>Get Started Now — It&apos;s Free</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Join Session Dialog Modal */}
      {showJoinModal && (
        <JoinPresentationDialog onCancel={setShowJoinModal} />
      )}
    </section>
  );
}
