import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernCard } from '@/components/ui/modern-card';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing Plans',
  description: 'Choose the perfect plan for your travel business. Start with a 14-day free trial, no credit card required.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-clio-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-clio-gray-900 border-b border-clio-gray-200 dark:border-clio-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-clio-blue rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">TravelFlow</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/" className="text-clio-gray-600 dark:text-clio-gray-300 hover:text-clio-blue transition-colors font-bold uppercase tracking-tight text-xs">Home</Link>
              <ModernButton variant="outline" size="sm" asChild>
                <Link href="/auth/login">Sign In</Link>
              </ModernButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-clio-gray-50 dark:bg-clio-gray-900/50 border-b border-clio-gray-100 dark:border-clio-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-5xl md:text-7xl font-black text-clio-gray-900 dark:text-white mb-6 uppercase tracking-tight leading-[0.9]">
              Simple, <span className="text-clio-blue">Transparent</span> Pricing
            </h1>
            <p className="text-xl text-clio-gray-600 dark:text-clio-gray-400 font-medium">
              Choose the plan that fits your business. Start with a 14-day free trial.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <ModernCard variant="elevated" className="p-8 bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 shadow-sm">
              <div className="mb-6">
                <h3 className="text-2xl font-black text-clio-gray-900 dark:text-white mb-2 uppercase tracking-tight">Starter</h3>
                <p className="text-clio-gray-500 dark:text-clio-gray-400 text-sm font-bold uppercase">For independent agents</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-black text-clio-gray-900 dark:text-white tracking-tighter">$49</span>
                  <span className="text-clio-gray-400 dark:text-clio-gray-500 text-xs font-bold uppercase ml-2">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-clio-blue mr-3 mt-0.5" />
                  <span className="text-clio-gray-700 dark:text-clio-gray-300 font-medium">Up to 50 active quotes</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-clio-blue mr-3 mt-0.5" />
                  <span className="text-clio-gray-700 dark:text-clio-gray-300 font-medium">500 contacts</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-clio-blue mr-3 mt-0.5" />
                  <span className="text-clio-gray-700 dark:text-clio-gray-300 font-medium">Basic quote builder</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-clio-blue mr-3 mt-0.5" />
                  <span className="text-clio-gray-700 dark:text-clio-gray-300 font-medium">Email support</span>
                </li>
              </ul>
              <ModernButton variant="outline" className="w-full h-12 font-bold uppercase tracking-tight text-xs" asChild>
                <Link href="/auth/signup">Start Free Trial</Link>
              </ModernButton>
            </ModernCard>

            {/* Professional Plan */}
            <ModernCard variant="elevated" className="p-8 border-2 border-clio-blue relative bg-white dark:bg-clio-gray-950 shadow-xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-clio-blue text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Most Popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-black text-clio-gray-900 dark:text-white mb-2 uppercase tracking-tight">Professional</h3>
                <p className="text-clio-gray-500 dark:text-clio-gray-400 text-sm font-bold uppercase">For growing agencies</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-black text-clio-gray-900 dark:text-white tracking-tighter">$149</span>
                  <span className="text-clio-gray-400 dark:text-clio-gray-500 text-xs font-bold uppercase ml-2">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-clio-blue mr-3 mt-0.5" />
                  <span className="text-clio-gray-700 dark:text-clio-gray-300 font-medium">Unlimited quotes</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-clio-blue mr-3 mt-0.5" />
                  <span className="text-clio-gray-700 dark:text-clio-gray-300 font-medium">Unlimited contacts</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-clio-blue mr-3 mt-0.5" />
                  <span className="text-clio-gray-700 dark:text-clio-gray-300 font-medium">Advanced quote wizard</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-clio-blue mr-3 mt-0.5" />
                  <span className="text-clio-gray-700 dark:text-clio-gray-300 font-medium">Visual timeline planning</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-clio-blue mr-3 mt-0.5" />
                  <span className="text-clio-gray-700 dark:text-clio-gray-300 font-medium">Priority support</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-clio-blue mr-3 mt-0.5" />
                  <span className="text-clio-gray-700 dark:text-clio-gray-300 font-medium">Team collaboration (up to 5)</span>
                </li>
              </ul>
              <ModernButton variant="primary" className="w-full h-12 font-black uppercase tracking-tight text-xs bg-clio-blue hover:bg-clio-blue-hover" asChild>
                <Link href="/auth/signup">Start Free Trial</Link>
              </ModernButton>
            </ModernCard>

            {/* Enterprise Plan */}
            <ModernCard variant="elevated" className="p-8 bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 shadow-sm">
              <div className="mb-6">
                <h3 className="text-2xl font-black text-clio-gray-900 dark:text-white mb-2 uppercase tracking-tight">Enterprise</h3>
                <p className="text-clio-gray-500 dark:text-clio-gray-400 text-sm font-bold uppercase">For large organizations</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-black text-clio-gray-900 dark:text-white tracking-tighter">Custom</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-clio-blue mr-3 mt-0.5" />
                  <span className="text-clio-gray-700 dark:text-clio-gray-300 font-medium">Everything in Professional</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-clio-blue mr-3 mt-0.5" />
                  <span className="text-clio-gray-700 dark:text-clio-gray-300 font-medium">Unlimited team members</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-clio-blue mr-3 mt-0.5" />
                  <span className="text-clio-gray-700 dark:text-clio-gray-300 font-medium">Custom integrations</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-clio-blue mr-3 mt-0.5" />
                  <span className="text-clio-gray-700 dark:text-clio-gray-300 font-medium">Dedicated account manager</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-clio-blue mr-3 mt-0.5" />
                  <span className="text-clio-gray-700 dark:text-clio-gray-300 font-medium">24/7 phone support</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-clio-blue mr-3 mt-0.5" />
                  <span className="text-clio-gray-700 dark:text-clio-gray-300 font-medium">SLA guarantee</span>
                </li>
              </ul>
              <ModernButton variant="outline" className="w-full h-12 font-bold uppercase tracking-tight text-xs" asChild>
                <Link href="/auth/signup">Contact Sales</Link>
              </ModernButton>
            </ModernCard>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white dark:bg-clio-gray-950">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-4xl font-black text-center text-clio-gray-900 dark:text-white mb-16 uppercase tracking-tight">
            Frequently Asked <span className="text-clio-blue">Questions</span>
          </h2>
          <div className="space-y-10">
            <div className="p-6 bg-clio-gray-50 dark:bg-clio-gray-900 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800">
              <h3 className="text-lg font-bold text-clio-gray-900 dark:text-white mb-3 uppercase tracking-tight">
                Can I change plans later?
              </h3>
              <p className="text-clio-gray-600 dark:text-clio-gray-400 font-medium">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="p-6 bg-clio-gray-50 dark:bg-clio-gray-900 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800">
              <h3 className="text-lg font-bold text-clio-gray-900 dark:text-white mb-3 uppercase tracking-tight">
                What payment methods do you accept?
              </h3>
              <p className="text-clio-gray-600 dark:text-clio-gray-400 font-medium">
                We accept all major credit cards, debit cards, and PayPal.
              </p>
            </div>
            <div className="p-6 bg-clio-gray-50 dark:bg-clio-gray-900 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800">
              <h3 className="text-lg font-bold text-clio-gray-900 dark:text-white mb-3 uppercase tracking-tight">
                Is there a setup fee?
              </h3>
              <p className="text-clio-gray-600 dark:text-clio-gray-400 font-medium">
                No setup fees, ever. You only pay for your monthly or annual subscription.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-clio-navy dark:bg-clio-blue relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-7xl font-black text-white mb-6 uppercase tracking-tight leading-[0.9]">
            Ready to <span className="opacity-60">Get Started?</span>
          </h2>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto font-medium">
            Start your 14-day free trial today. No credit card required.
          </p>
          <ModernButton size="lg" variant="outline" className="bg-white text-clio-navy border-none hover:bg-white/90 h-16 px-12 font-black uppercase tracking-widest text-sm" asChild>
            <Link href="/auth/signup">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </ModernButton>
        </div>
      </section>
    </div>
  );
}
