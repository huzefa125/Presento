import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';

/**
 * Landing page footer. Split out of Landing.jsx; see CODE_STANDARDS.md.
 * Fully self-contained - no Landing state dependencies.
 */
export default function Footer() {
  const { t } = useTranslation();

  return (
      <footer className="border-t border-hairline bg-canvas-soft pt-20 pb-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 mb-16 sm:px-28 px-2">
            {/* Column 1: Brand */}
            <div className="space-y-6 col-start-1 lg:col-start-1">
              <div className="flex md:grid grid-cols-1 items-center justify-start gap-2">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-[var(--shadow-level-1)]">
                  <span className="text-2xl font-bold text-on-primary">𝑖</span>
                </div>
                <span className="text-3xl font-bold text-ink">{t('navbar.brand_name')}</span>
              </div>
              <p className="text-ink-muted leading-relaxed max-w-sm">
                {t('footer.empowering_education')}
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div className="lg:pl-10">
              <h3 className="text-lg font-bold text-ink mb-6">{t('footer.quick_links')}</h3>
              <ul className="space-y-4">
                {[
                  { name: t('footer.about_us'), path: "/about" },
                  { name: t('footer.pricing'), path: "/pricing" },
                  { name: t('footer.careers'), path: "/careers" },
                  { name: t('footer.contact'), path: "/contact" }
                ].map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-ink-muted hover:text-primary transition-colors inline-block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Contact Us */}
            <div>
              <h3 className="text-lg font-bold text-ink mb-6">{t('footer.contact_us')}</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent-sky/10 flex items-center justify-center shrink-0 text-accent-sky">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-ink-muted mb-1">{t('footer.email')}</p>
                    <a href="mailto:support@inavora.com" className="text-ink font-medium hover:text-primary transition-colors">
                      support@inavora.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent-orange/10 flex items-center justify-center shrink-0 text-accent-orange">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-ink-muted mb-1">{t('footer.location')}</p>
                    <p className="text-ink font-medium">
                      {t('footer.location_address')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Big Interactive Text */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.2,
                  animation: 'easeIn'
                }
              }
            }}
            className="w-full flex overflow-hidden justify-center mt-16 select-none pointer-events-none"
          >
            {["P", "R", "E", "S", "E", "N", "T", "O"].map((letter, index) => (
              <motion.span
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="text-[17vw] font-black leading-none text-ink/10"
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>

          {/* Bottom Bar */}
          <div className="mt-5 flex flex-col md:flex-row items-center justify-center gap-4">
            <p className="text-ink-faint text-sm">
              {t('footer.rights_reserved', { brandName: t('navbar.brand_name') })}
            </p>
            <div className="flex items-center gap-6">
              <Link to="/privacy-policy" className="text-ink-faint hover:text-primary text-sm transition-colors">
                {t('footer.privacy_policy')}
              </Link>
              <Link to="/terms-of-service" className="text-ink-faint hover:text-primary text-sm transition-colors">
                {t('footer.terms_of_service')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
  );
}
