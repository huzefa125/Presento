import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

/**
 * Landing page pricing section. Split out of Landing.jsx; see
 * CODE_STANDARDS.md. Fully self-contained - billingCycle was Landing state
 * used nowhere outside this section, so it's local state here instead.
 */
export default function PricingSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');

  return (
        <section id="pricing" className="container mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-6 tracking-tight"
              dangerouslySetInnerHTML={{ __html: t('landing.simple_transparent_pricing') }}
            >
            </motion.h2>
            <p className="text-xl text-ink-muted max-w-2xl mx-auto mb-8">
              {t('landing.start_free_upgrade')}
            </p>
            <Link
              to="/pricing"
              className="w-fit sm:w-fit mx-auto px-8 py-4 rounded-full bg-surface border border-hairline text-ink font-semibold text-lg hover:bg-canvas-soft transition-all flex items-center justify-center gap-2 shadow-[var(--shadow-level-1)]"
            >
              {t('landing.see_plans_details')}
            </Link>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-ink' : 'text-ink-faint'}`}>
              {t('pricing.billing_toggle_monthly')}
            </span>
            <button
              onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-14 h-8 rounded-full bg-canvas-soft border border-hairline transition-colors focus:outline-none"
            >
              <motion.div
                animate={{ x: billingCycle === 'monthly' ? 2 : 26 }}
                className="w-6 h-6 rounded-full bg-primary shadow-[var(--shadow-level-1)]"
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-ink' : 'text-ink-faint'}`}>
              {t('pricing.billing_toggle_yearly')} <span className="text-accent-green text-xs ml-1">({t('pricing.billing_toggle_save')})</span>
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: t('landing.pricing_free'),
                price: t('landing.pricing_free_price'),
                features: [
                  t('pricing.free_plan_feature1'),
                  t('pricing.free_plan_feature2'),
                  t('pricing.free_plan_feature3'),
                  t('pricing.free_plan_feature4')
                ],
                nameColor: 'text-accent-sky',
                checkColor: 'bg-accent-sky',
                borderColor: 'border-hairline',
                bgGlow: 'bg-surface'
              },
              {
                name: t('landing.pricing_pro'),
                price: billingCycle === 'monthly' ? t('landing.pricing_pro_price') : t('landing.pricing_pro_yearly_price'),
                period: billingCycle === 'monthly' ? t('pricing.pro_plan_period_monthly') : t('pricing.pro_plan_period_yearly'),
                originalPrice: billingCycle === 'yearly' ? t('landing.pricing_pro_original_price') : null,
                saveLabel: billingCycle === 'yearly' ? t('pricing.pro_plan_save_label') : null,
                features: [
                  t('pricing.pro_plan_feature1'),
                  t('pricing.pro_plan_feature2'),
                  t('pricing.pro_plan_feature3'),
                  t('pricing.pro_plan_feature4'),
                  t('pricing.pro_plan_feature5'),
                  t('pricing.pro_plan_feature6')
                ],
                nameColor: 'text-accent-teal',
                checkColor: 'bg-accent-teal',
                borderColor: 'border-hairline',
                bgGlow: 'bg-surface'
              },
              {
                name: t('landing.pricing_lifetime'),
                price: t('landing.pricing_lifetime_price'),
                period: t('pricing.lifetime_plan_period'),
                features: [
                  t('pricing.lifetime_plan_feature1'),
                  t('pricing.lifetime_plan_feature2'),
                  t('pricing.lifetime_plan_feature3'),
                  t('pricing.lifetime_plan_feature4'),
                  t('pricing.lifetime_plan_feature5')
                ],
                highlight: true,
                saveLabel: t('landing.pricing_popular'),
                nameColor: 'text-accent-orange',
                checkColor: 'bg-accent-orange',
                borderColor: 'border-primary/30',
                bgGlow: 'bg-canvas-soft'
              },
              {
                name: t('landing.pricing_institution'),
                price: t('pricing.institution_plan_price'),
                period: t('pricing.institution_plan_period'),
                features: [
                  t('pricing.institution_plan_feature2'),
                  t('pricing.institution_plan_feature3'),
                  t('pricing.institution_plan_feature4'),
                  t('pricing.institution_plan_feature6'),
                  t('pricing.institution_plan_feature5'),
                  t('pricing.lifetime_plan_feature5')
                ],
                nameColor: 'text-accent-purple-deep',
                checkColor: 'bg-accent-purple-deep',
                borderColor: 'border-hairline',
                bgGlow: 'bg-surface'
              }
            ].map((plan, index) => (              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative flex flex-col rounded-lg border ${plan.borderColor} ${plan.bgGlow} overflow-hidden group transition-all duration-300 p-6 hover:shadow-[var(--shadow-level-1)]`}
              >
                {(plan.highlight || plan.saveLabel) && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-primary text-on-primary text-xs font-bold px-3 py-1 rounded-bl-lg">
                      {plan.saveLabel || t('landing.pricing_popular')}
                    </div>
                  </div>
                )}

                <h3 className={`text-xl font-bold mb-2 ${plan.nameColor}`}>
                  {plan.name}
                </h3>

                <div className="mb-4">
                  {plan.originalPrice && (
                    <div className="text-ink-faint text-sm line-through mb-1">
                      {plan.originalPrice}
                    </div>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-ink">{plan.price}</span>
                    {plan.period && <span className="text-ink-muted text-sm">{plan.period}</span>}
                  </div>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-ink-secondary">
                      <div className={`mt-1 w-4 h-4 rounded-full ${plan.checkColor} flex items-center justify-center shrink-0`}>
                        <Check className="w-2 h-2 text-on-primary" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate(plan.name === t('landing.pricing_institution') ? '/institution/register' : '/register')}
                  className={`w-full py-3 rounded-full font-bold text-sm transition-all ${plan.highlight
                    ? 'bg-primary text-on-primary hover:bg-primary-active'
                    : 'bg-surface border border-hairline text-ink hover:bg-canvas-soft'
                    }`}
                >
                  {t('landing.pricing_get_started')}
                </button>
              </motion.div>
            ))}
          </div>
        </section>
  );
}
