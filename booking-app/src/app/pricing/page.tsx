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
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">TravelFlow</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">Home</Link>
              <ModernButton variant="outline" size="sm" asChild>
                <Link href="/auth/login">Sign In</Link>
              </ModernButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Choose the plan that fits your business. Start with a 14-day free trial.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <ModernCard variant="elevated" className="p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Starter</h3>
                <p className="text-gray-600 dark:text-gray-400">For independent travel agents</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">$49</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Up to 50 active quotes</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">500 contacts</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Basic quote builder</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Email support</span>
                </li>
              </ul>
              <ModernButton variant="outline" className="w-full" asChild>
                <Link href="/auth/signup">Start Free Trial</Link>
              </ModernButton>
            </ModernCard>

            {/* Professional Plan */}
            <ModernCard variant="elevated" className="p-8 border-2 border-blue-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Professional</h3>
                <p className="text-gray-600 dark:text-gray-400">For growing travel agencies</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">$149</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Unlimited quotes</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Unlimited contacts</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Advanced quote wizard</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Visual timeline planning</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Priority support</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Team collaboration (up to 5)</span>
                </li>
              </ul>
              <ModernButton variant="primary" className="w-full" asChild>
                <Link href="/auth/signup">Start Free Trial</Link>
              </ModernButton>
            </ModernCard>

            {/* Enterprise Plan */}
            <ModernCard variant="elevated" className="p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Enterprise</h3>
                <p className="text-gray-600 dark:text-gray-400">For large organizations</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">Custom</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Everything in Professional</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Unlimited team members</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Custom integrations</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Dedicated account manager</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">24/7 phone support</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">SLA guarantee</span>
                </li>
              </ul>
              <ModernButton variant="outline" className="w-full" asChild>
                <Link href="/auth/signup">Contact Sales</Link>
              </ModernButton>
            </ModernCard>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Can I change plans later?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We accept all major credit cards, debit cards, and PayPal.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Is there a setup fee?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No setup fees, ever. You only pay for your monthly or annual subscription.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Start your 14-day free trial today. No credit card required.
          </p>
          <ModernButton size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" asChild>
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
