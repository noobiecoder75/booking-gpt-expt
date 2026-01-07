import Link from 'next/link';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernCard } from '@/components/ui/modern-card';
import {
  Sparkles,
  Users,
  Calendar,
  FileText,
  Clock,
  BarChart3,
  Globe,
  Shield,
  Zap,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Database
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Discover powerful features designed for modern travel professionals. Contact management, quote building, timeline planning, and more.',
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-clio-gray-900 border-b border-clio-gray-100 dark:border-clio-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-clio-blue rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-clio-gray-900 dark:text-gray-100">TravelFlow</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">Home</Link>
              <Link href="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">Pricing</Link>
              <ModernButton variant="primary" size="sm" asChild>
                <Link href="/auth/signup">Get Started</Link>
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
              Everything You Need in One Platform
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Powerful features designed for modern travel professionals to streamline workflows and grow their business.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ModernCard variant="elevated" className="p-8 hover-lift">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Smart Contact Management</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Complete CRM system with intelligent search, tagging, and relationship mapping. Keep track of all your clients and their preferences in one place.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Advanced search and filtering</li>
                <li>• Custom tags and categories</li>
                <li>• Client communication history</li>
                <li>• Birthday and anniversary reminders</li>
              </ul>
            </ModernCard>

            <ModernCard variant="elevated" className="p-8 hover-lift">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Visual Timeline Planning</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Professional calendar interface powered by react-big-calendar for intuitive itinerary visualization and planning.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Drag-and-drop itinerary builder</li>
                <li>• Multi-day trip planning</li>
                <li>• Color-coded activities</li>
                <li>• Real-time collaboration</li>
              </ul>
            </ModernCard>

            <ModernCard variant="elevated" className="p-8 hover-lift">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Intelligent Quote Wizard</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Step-by-step quote builder with flights, hotels, activities, and automated pricing calculations.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Professional quote templates</li>
                <li>• Automated pricing markup</li>
                <li>• PDF export and sharing</li>
                <li>• Version history tracking</li>
              </ul>
            </ModernCard>

            <ModernCard variant="elevated" className="p-8 hover-lift">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Travel Item Management</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Color-coded system for flights, accommodations, activities, and transfers with drag-and-drop organization.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Flight tracking and alerts</li>
                <li>• Hotel and accommodation database</li>
                <li>• Activity catalog</li>
                <li>• Transfer coordination</li>
              </ul>
            </ModernCard>

            <ModernCard variant="elevated" className="p-8 hover-lift">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Business Analytics</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Track revenue, conversion rates, and business performance with comprehensive analytics dashboards.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Revenue tracking</li>
                <li>• Quote conversion analytics</li>
                <li>• Customer insights</li>
                <li>• Performance reports</li>
              </ul>
            </ModernCard>

            <ModernCard variant="elevated" className="p-8 hover-lift">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Enterprise Security</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Bank-level security with encryption, secure authentication, and compliance with industry standards.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• 256-bit encryption</li>
                <li>• GDPR compliant</li>
                <li>• Regular security audits</li>
                <li>• Role-based access control</li>
              </ul>
            </ModernCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Workflow?
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
