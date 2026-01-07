"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernCard, ModernCardContent } from '@/components/ui/modern-card';
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle';
import { BlurFade } from '@/components/ui/blur-fade';
import { Particles } from '@/components/ui/particles';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { ScrollProgress } from '@/components/ui/scroll-progress';
import {
  Calendar,
  Users,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Star,
  CheckCircle,
  BarChart3,
  Shield,
  Headphones
} from 'lucide-react';

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://travelflow.com/#organization',
        name: 'TravelFlow',
        url: 'https://travelflow.com',
        logo: {
          '@type': 'ImageObject',
          url: 'https://travelflow.com/logo.png',
        },
        sameAs: [
          'https://twitter.com/travelflow',
          'https://www.linkedin.com/company/travelflow',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://travelflow.com/#website',
        url: 'https://travelflow.com',
        name: 'TravelFlow',
        publisher: {
          '@id': 'https://travelflow.com/#organization',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://travelflow.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'TravelFlow',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: '14-day free trial',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '500',
        },
        description: 'AI-powered travel booking management and quote building platform for travel agencies',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white dark:bg-clio-gray-950">
      <ScrollProgress position="top" height="3px" color="#3b82f6" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-clio-gray-900 border-b border-clio-gray-200 dark:border-clio-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-clio-blue rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">TravelFlow</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-clio-gray-600 dark:text-clio-gray-300 hover:text-clio-blue dark:hover:text-white transition-colors font-bold uppercase tracking-tight text-xs">Features</Link>
              <Link href="/pricing" className="text-clio-gray-600 dark:text-clio-gray-300 hover:text-clio-blue dark:hover:text-white transition-colors font-bold uppercase tracking-tight text-xs">Pricing</Link>
              <Link href="/dashboard/quotes" className="text-clio-gray-600 dark:text-clio-gray-300 hover:text-clio-blue dark:hover:text-white transition-colors font-bold uppercase tracking-tight text-xs">Dashboard</Link>
              <DarkModeToggle />
              <ModernButton variant="outline" size="sm" asChild>
                <Link href="/auth/login">Sign In</Link>
              </ModernButton>
              <ModernButton variant="primary" size="sm" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </ModernButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 bg-white dark:bg-clio-gray-950 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <BlurFade delay={0.1} direction="down">
              <div className="inline-flex items-center gap-2 bg-clio-gray-100 dark:bg-clio-gray-900 border border-clio-gray-200 dark:border-clio-gray-800 rounded-full px-4 py-2 mb-8">
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <span className="text-clio-gray-600 dark:text-clio-gray-300 text-xs font-bold uppercase tracking-widest">Trusted by 500+ Travel Professionals</span>
              </div>
            </BlurFade>

            <BlurFade delay={0.2} direction="down">
              <h1 className="text-6xl md:text-8xl font-black text-clio-gray-900 dark:text-white mb-6 leading-[0.9] tracking-tighter uppercase">
                AI-Powered Travel
                <span className="block text-clio-blue">
                  Management Platform
                </span>
              </h1>
            </BlurFade>

            <BlurFade delay={0.3} direction="down">
              <p className="text-xl md:text-2xl text-clio-gray-600 dark:text-clio-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
                Streamline your travel business with intelligent quote building, contact management, and automated workflows
              </p>
            </BlurFade>

            <BlurFade delay={0.4} direction="down">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <ShimmerButton
                  shimmerColor="#3b82f6"
                  background="#1e3a8a"
                  className="text-lg px-10 py-5 min-w-[240px] text-white"
                  onClick={() => window.location.href = '/auth/signup'}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Start Free Trial
                </ShimmerButton>
                <ModernButton size="lg" variant="outline" className="border-clio-gray-200 dark:border-clio-gray-800 text-clio-gray-900 dark:text-white hover:bg-clio-gray-50 dark:hover:bg-clio-gray-900 text-lg px-10 py-5 h-auto min-w-[240px]" asChild>
                  <Link href="/dashboard/quotes">
                    <FileText className="w-5 h-5 mr-2" />
                    View Dashboard
                  </Link>
                </ModernButton>
              </div>
            </BlurFade>

            <BlurFade delay={0.5} direction="down">
              <div className="flex items-center justify-center gap-8 text-clio-gray-400 dark:text-clio-gray-500 text-[10px] font-bold uppercase tracking-widest flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-clio-blue" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-clio-blue" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-clio-blue" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </BlurFade>
          </div>
        </div>

        {/* Minimalist Grid Pattern */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-clio-gray-50 dark:bg-clio-gray-900">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-black text-clio-gray-900 dark:text-white mb-6 uppercase tracking-tight">
                Everything You Need to
                <span className="text-clio-blue"> Succeed</span>
              </h2>
              <p className="text-xl text-clio-gray-600 dark:text-clio-gray-400 max-w-2xl mx-auto font-medium">
                Built for modern travel professionals who demand efficiency, elegance, and results
              </p>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            <BlurFade delay={0.2} inView>
              <ModernCard variant="elevated" className="p-8 group h-full bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 shadow-sm hover:shadow-md transition-all">
                <div className="w-16 h-16 bg-clio-blue/10 dark:bg-clio-blue/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-clio-blue" />
                </div>
                <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white mb-3 uppercase tracking-tight">Smart CRM</h3>
                <p className="text-clio-gray-600 dark:text-clio-gray-400 leading-relaxed font-medium text-sm">
                  Complete CRM with intelligent search, tagging, and relationship mapping for seamless customer management
                </p>
              </ModernCard>
            </BlurFade>

            <BlurFade delay={0.3} inView>
              <ModernCard variant="elevated" className="p-8 group h-full bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 shadow-sm hover:shadow-md transition-all">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Calendar className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white mb-3 uppercase tracking-tight">Visual Timeline</h3>
                <p className="text-clio-gray-600 dark:text-clio-gray-400 leading-relaxed font-medium text-sm">
                  Professional calendar interface powered by react-big-calendar for intuitive itinerary visualization
                </p>
              </ModernCard>
            </BlurFade>

            <BlurFade delay={0.4} inView>
              <ModernCard variant="elevated" className="p-8 group h-full bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 shadow-sm hover:shadow-md transition-all">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white mb-3 uppercase tracking-tight">Quote Wizard</h3>
                <p className="text-clio-gray-600 dark:text-clio-gray-400 leading-relaxed font-medium text-sm">
                  Step-by-step intelligent quote builder with flights, hotels, activities, and automated pricing
                </p>
              </ModernCard>
            </BlurFade>

            <BlurFade delay={0.5} inView>
              <ModernCard variant="elevated" className="p-8 group h-full bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 shadow-sm hover:shadow-md transition-all">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white mb-3 uppercase tracking-tight">Itinerary Control</h3>
                <p className="text-clio-gray-600 dark:text-clio-gray-400 leading-relaxed font-medium text-sm">
                  Color-coded management system for flights, accommodations, activities, and transfers with drag-and-drop
                </p>
              </ModernCard>
            </BlurFade>
          </div>

          {/* Stats Section */}
          <BlurFade delay={0.6} inView>
            <ModernCard variant="elevated" className="p-8 md:p-12 bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-black text-clio-blue mb-2 tracking-tighter">500+</div>
                  <div className="text-clio-gray-400 dark:text-clio-gray-500 text-[10px] font-bold uppercase tracking-widest">Travel Agencies</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-black text-emerald-600 dark:text-emerald-400 mb-2 tracking-tighter">50k+</div>
                  <div className="text-clio-gray-400 dark:text-clio-gray-500 text-[10px] font-bold uppercase tracking-widest">Quotes Generated</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-black text-purple-600 dark:text-purple-400 mb-2 tracking-tighter">99.9%</div>
                  <div className="text-clio-gray-400 dark:text-clio-gray-500 text-[10px] font-bold uppercase tracking-widest">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-black text-amber-500 mb-2 tracking-tighter">4.9★</div>
                  <div className="text-clio-gray-400 dark:text-clio-gray-500 text-[10px] font-bold uppercase tracking-widest">Customer Rating</div>
                </div>
              </div>
            </ModernCard>
          </BlurFade>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-clio-navy dark:bg-clio-blue relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <BlurFade delay={0.1} inView>
            <h2 className="text-4xl md:text-7xl font-black text-white mb-6 uppercase tracking-tight leading-[0.9]">
              Ready to Transform Your
              <span className="block opacity-60">Travel Business?</span>
            </h2>
          </BlurFade>
          <BlurFade delay={0.2} inView>
            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto font-medium">
              Join hundreds of travel professionals already using TravelFlow to streamline their workflow
            </p>
          </BlurFade>

          <BlurFade delay={0.3} inView>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <ShimmerButton
                shimmerColor="#ffffff"
                background="#ffffff"
                className="text-lg px-12 py-6 min-w-[260px] !text-clio-navy font-black uppercase tracking-widest"
                onClick={() => window.location.href = '/auth/signup'}
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Free Trial
              </ShimmerButton>
              <button
                onClick={() => window.location.href = '/dashboard/quotes'}
                className="text-white/80 hover:text-white transition-all text-sm font-bold uppercase tracking-widest border-b-2 border-white/20 hover:border-white pb-1"
              >
                View Demo →
              </button>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-clio-gray-950 border-t border-clio-gray-100 dark:border-clio-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-clio-blue rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">TravelFlow</span>
              </div>
              <p className="text-clio-gray-600 dark:text-clio-gray-400 mb-8 max-w-md font-medium leading-relaxed">
                Streamline your travel business with AI-powered booking management, intelligent quoting, and automated workflows.
              </p>
              <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-clio-gray-400">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>Enterprise Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-clio-blue" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-clio-gray-900 dark:text-white font-bold uppercase tracking-widest text-xs mb-6">Quick Access</h4>
              <div className="space-y-4">
                <Link href="/dashboard/quotes" className="block text-sm text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-blue dark:hover:text-white transition-colors font-medium">View Quotes</Link>
                <Link href="/dashboard/timeline" className="block text-sm text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-blue dark:hover:text-white transition-colors font-medium">Timeline</Link>
                <Link href="/dashboard/contacts" className="block text-sm text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-blue dark:hover:text-white transition-colors font-medium">Contacts</Link>
                <Link href="/pricing" className="block text-sm text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-blue dark:hover:text-white transition-colors font-medium">Pricing</Link>
              </div>
            </div>
            
            <div>
              <h4 className="text-clio-gray-900 dark:text-white font-bold uppercase tracking-widest text-xs mb-6">Support</h4>
              <div className="space-y-4">
                <Link href="#" className="block text-sm text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-blue dark:hover:text-white transition-colors font-medium">Documentation</Link>
                <Link href="#" className="block text-sm text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-blue dark:hover:text-white transition-colors font-medium">Help Center</Link>
                <Link href="#" className="block text-sm text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-blue dark:hover:text-white transition-colors font-medium">Contact</Link>
                <Link href="#" className="block text-sm text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-blue dark:hover:text-white transition-colors font-medium">Status</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-clio-gray-100 dark:border-clio-gray-900 pt-10 flex flex-col md:flex-row items-center justify-between">
            <p className="text-clio-gray-400 dark:text-clio-gray-600 text-[10px] font-bold uppercase tracking-widest">
              © 2026 TravelFlow. All rights reserved.
            </p>
            <div className="flex items-center gap-8 mt-6 md:mt-0 text-[10px] font-bold uppercase tracking-widest">
              <Link href="#" className="text-clio-gray-400 dark:text-clio-gray-600 hover:text-clio-blue transition-colors">Privacy</Link>
              <Link href="#" className="text-clio-gray-400 dark:text-clio-gray-600 hover:text-clio-blue transition-colors">Terms</Link>
              <Link href="#" className="text-clio-gray-400 dark:text-clio-gray-600 hover:text-clio-blue transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
