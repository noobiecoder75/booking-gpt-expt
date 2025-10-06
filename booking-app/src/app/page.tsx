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
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <ScrollProgress position="top" height="3px" color="linear-gradient(90deg, #667eea 0%, #764ba2 100%)" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">TravelFlow</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Features</Link>
              <Link href="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Pricing</Link>
              <Link href="/dashboard/quotes" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Dashboard</Link>
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
      <section className="pt-24 pb-20 bg-gradient-hero relative overflow-hidden">
        <Particles
          className="absolute inset-0"
          quantity={80}
          ease={80}
          color="#ffffff"
          size={0.8}
          refresh={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/20 dark:to-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <BlurFade delay={0.1} direction="down">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 mb-8">
                <Star className="w-4 h-4 text-yellow-300 fill-current" />
                <span className="text-white text-sm">Trusted by 500+ Travel Professionals</span>
              </div>
            </BlurFade>

            <BlurFade delay={0.2} direction="down">
              <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
                AI-Powered Travel
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-cyan-200 via-blue-200 to-yellow-200 animate-gradient">
                  Management Platform
                </span>
              </h1>
            </BlurFade>

            <BlurFade delay={0.3} direction="down">
              <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                Streamline your travel business with intelligent quote building, contact management, and automated workflows
              </p>
            </BlurFade>

            <BlurFade delay={0.4} direction="down">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <ShimmerButton
                  shimmerColor="#60a5fa"
                  background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  className="text-lg px-8 py-4 min-w-[200px]"
                  onClick={() => window.location.href = '/auth/signup'}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Start Free Trial
                </ShimmerButton>
                <ModernButton size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-lg px-8 py-4" asChild>
                  <Link href="/dashboard/quotes">
                    <FileText className="w-5 h-5 mr-2" />
                    View Dashboard
                  </Link>
                </ModernButton>
              </div>
            </BlurFade>

            <BlurFade delay={0.5} direction="down">
              <div className="flex items-center justify-center gap-8 text-white/80 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </BlurFade>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Everything You Need to
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"> Succeed</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Built for modern travel professionals who demand efficiency, elegance, and results
              </p>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <BlurFade delay={0.2} inView>
              <ModernCard variant="elevated" className="p-8 hover-lift group h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Smart Contact Management</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Complete CRM with intelligent search, tagging, and relationship mapping for seamless customer management
                </p>
              </ModernCard>
            </BlurFade>

            <BlurFade delay={0.3} inView>
              <ModernCard variant="elevated" className="p-8 hover-lift group h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Visual Timeline</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Professional calendar interface powered by react-big-calendar for intuitive itinerary visualization
                </p>
              </ModernCard>
            </BlurFade>

            <BlurFade delay={0.4} inView>
              <ModernCard variant="elevated" className="p-8 hover-lift group h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Quote Wizard</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Step-by-step intelligent quote builder with flights, hotels, activities, and automated pricing
                </p>
              </ModernCard>
            </BlurFade>

            <BlurFade delay={0.5} inView>
              <ModernCard variant="elevated" className="p-8 hover-lift group h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Travel Items</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Color-coded management system for flights, accommodations, activities, and transfers with drag-and-drop
                </p>
              </ModernCard>
            </BlurFade>
          </div>

          {/* Stats Section */}
          <BlurFade delay={0.6} inView>
            <ModernCard variant="elevated" className="p-8 md:p-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2">500+</div>
                  <div className="text-gray-600 dark:text-gray-400">Travel Agencies</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 mb-2">50k+</div>
                  <div className="text-gray-600 dark:text-gray-400">Quotes Generated</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-2">99.9%</div>
                  <div className="text-gray-600 dark:text-gray-400">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600 mb-2">4.9★</div>
                  <div className="text-gray-600 dark:text-gray-400">Customer Rating</div>
                </div>
              </div>
            </ModernCard>
          </BlurFade>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary relative overflow-hidden">
        <Particles
          className="absolute inset-0"
          quantity={60}
          ease={70}
          color="#ffffff"
          size={0.6}
          refresh={false}
        />
        <div className="container mx-auto px-4 text-center relative z-10">
          <BlurFade delay={0.1} inView>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200">Travel Business?</span>
            </h2>
          </BlurFade>
          <BlurFade delay={0.2} inView>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Join hundreds of travel professionals already using TravelFlow to streamline their workflow
            </p>
          </BlurFade>

          <BlurFade delay={0.3} inView>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <ShimmerButton
                shimmerColor="#60a5fa"
                background="linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)"
                className="text-lg px-10 py-5 min-w-[220px] !text-blue-600 font-semibold"
                onClick={() => window.location.href = '/auth/signup'}
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Free Trial
              </ShimmerButton>
              <button
                onClick={() => window.location.href = '/dashboard/quotes'}
                className="text-white/90 hover:text-white transition-colors text-lg font-medium underline underline-offset-4"
              >
                View Demo →
              </button>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">TravelFlow</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Streamline your travel business with AI-powered booking management, intelligent quoting, and automated workflows.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Enterprise Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Access</h4>
              <div className="space-y-2">
                <Link href="/dashboard/quotes" className="block hover:text-white transition-colors">View Quotes</Link>
                <Link href="/dashboard/timeline" className="block hover:text-white transition-colors">Timeline</Link>
                <Link href="/dashboard/contacts" className="block hover:text-white transition-colors">Contacts</Link>
                <Link href="/pricing" className="block hover:text-white transition-colors">Pricing</Link>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <div className="space-y-2">
                <Link href="#" className="block hover:text-white transition-colors">Documentation</Link>
                <Link href="#" className="block hover:text-white transition-colors">Help Center</Link>
                <Link href="#" className="block hover:text-white transition-colors">Contact</Link>
                <Link href="#" className="block hover:text-white transition-colors">Status</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-400 text-sm">
              © 2024 TravelFlow. All rights reserved.
            </p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
