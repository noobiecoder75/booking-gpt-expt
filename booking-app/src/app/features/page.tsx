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

            <div className="flex items-center space-x-8">
              <Link href="/" className="text-clio-gray-600 dark:text-clio-gray-300 hover:text-clio-blue dark:hover:text-white transition-colors font-bold uppercase tracking-tight text-xs">Home</Link>
              <Link href="/pricing" className="text-clio-gray-600 dark:text-clio-gray-300 hover:text-clio-blue dark:hover:text-white transition-colors font-bold uppercase tracking-tight text-xs">Pricing</Link>
              <ModernButton variant="primary" size="sm" asChild>
                <Link href="/auth/signup">Get Started</Link>
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
              Everything You Need in <span className="text-clio-blue">One Platform</span>
            </h1>
            <p className="text-xl text-clio-gray-600 dark:text-clio-gray-400 font-medium">
              Powerful features designed for modern travel professionals to streamline workflows and grow their business.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ModernCard variant="elevated" className="p-8 group bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-16 h-16 bg-clio-blue/10 dark:bg-clio-blue/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-clio-blue" />
              </div>
              <h3 className="text-2xl font-black text-clio-gray-900 dark:text-white mb-4 uppercase tracking-tight">Smart CRM</h3>
              <p className="text-clio-gray-600 dark:text-clio-gray-400 mb-6 font-medium leading-relaxed">
                Complete CRM system with intelligent search, tagging, and relationship mapping. Keep track of all your clients and their preferences in one place.
              </p>
              <ul className="space-y-3 text-sm text-clio-gray-500 dark:text-clio-gray-400 font-bold uppercase tracking-tight">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-clio-blue"></span> Advanced search and filtering</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-clio-blue"></span> Custom tags and categories</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-clio-blue"></span> communication history</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-clio-blue"></span> Automated reminders</li>
              </ul>
            </ModernCard>

            <ModernCard variant="elevated" className="p-8 group bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-2xl font-black text-clio-gray-900 dark:text-white mb-4 uppercase tracking-tight">Visual Timeline</h3>
              <p className="text-clio-gray-600 dark:text-clio-gray-400 mb-6 font-medium leading-relaxed">
                Professional calendar interface powered by react-big-calendar for intuitive itinerary visualization and planning.
              </p>
              <ul className="space-y-3 text-sm text-clio-gray-500 dark:text-clio-gray-400 font-bold uppercase tracking-tight">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Drag-and-drop builder</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Multi-day trip planning</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Color-coded activities</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Real-time collaboration</li>
              </ul>
            </ModernCard>

            <ModernCard variant="elevated" className="p-8 group bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-black text-clio-gray-900 dark:text-white mb-4 uppercase tracking-tight">Quote Wizard</h3>
              <p className="text-clio-gray-600 dark:text-clio-gray-400 mb-6 font-medium leading-relaxed">
                Step-by-step quote builder with flights, hotels, activities, and automated pricing calculations.
              </p>
              <ul className="space-y-3 text-sm text-clio-gray-500 dark:text-clio-gray-400 font-bold uppercase tracking-tight">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Professional templates</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Automated markup</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> PDF export and sharing</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Version history</li>
              </ul>
            </ModernCard>

            <ModernCard variant="elevated" className="p-8 group bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-2xl font-black text-clio-gray-900 dark:text-white mb-4 uppercase tracking-tight">Item Control</h3>
              <p className="text-clio-gray-600 dark:text-clio-gray-400 mb-6 font-medium leading-relaxed">
                Color-coded system for flights, accommodations, activities, and transfers with drag-and-drop organization.
              </p>
              <ul className="space-y-3 text-sm text-clio-gray-500 dark:text-clio-gray-400 font-bold uppercase tracking-tight">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Flight tracking</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Hotel database</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Activity catalog</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Transfer coordination</li>
              </ul>
            </ModernCard>

            <ModernCard variant="elevated" className="p-8 group bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-2xl font-black text-clio-gray-900 dark:text-white mb-4 uppercase tracking-tight">Analytics</h3>
              <p className="text-clio-gray-600 dark:text-clio-gray-400 mb-6 font-medium leading-relaxed">
                Track revenue, conversion rates, and business performance with comprehensive analytics dashboards.
              </p>
              <ul className="space-y-3 text-sm text-clio-gray-500 dark:text-clio-gray-400 font-bold uppercase tracking-tight">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Revenue tracking</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Conversion analytics</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Customer insights</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Performance reports</li>
              </ul>
            </ModernCard>

            <ModernCard variant="elevated" className="p-8 group bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-2xl font-black text-clio-gray-900 dark:text-white mb-4 uppercase tracking-tight">Security</h3>
              <p className="text-clio-gray-600 dark:text-clio-gray-400 mb-6 font-medium leading-relaxed">
                Bank-level security with encryption, secure authentication, and compliance with industry standards.
              </p>
              <ul className="space-y-3 text-sm text-clio-gray-500 dark:text-clio-gray-400 font-bold uppercase tracking-tight">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span> 256-bit encryption</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span> GDPR compliant</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span> Regular audits</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span> Role-based access</li>
              </ul>
            </ModernCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-clio-navy dark:bg-clio-blue relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-7xl font-black text-white mb-6 uppercase tracking-tight leading-[0.9]">
            Ready to Transform <span className="opacity-60">Your Workflow?</span>
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
