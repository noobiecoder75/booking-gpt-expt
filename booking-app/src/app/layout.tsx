import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://travelflow.com'),
  title: {
    default: 'TravelFlow - AI-Powered Travel Management Platform for Travel Agencies',
    template: '%s | TravelFlow',
  },
  description: 'Streamline your travel business with TravelFlow. AI-powered booking management, intelligent quote building, contact CRM, and automated workflows for travel agencies and professionals.',
  keywords: ['travel management software', 'travel agency CRM', 'booking platform', 'travel quotes', 'itinerary planning', 'travel business software', 'AI travel tools', 'GDS integration'],
  authors: [{ name: 'TravelFlow' }],
  creator: 'TravelFlow',
  publisher: 'TravelFlow',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://travelflow.com',
    siteName: 'TravelFlow',
    title: 'TravelFlow - AI-Powered Travel Management Platform',
    description: 'Streamline your travel business with intelligent booking management, automated quoting, and contact CRM. Trusted by 500+ travel professionals.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TravelFlow - Travel Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TravelFlow - AI-Powered Travel Management Platform',
    description: 'Streamline your travel business with intelligent booking management, automated quoting, and contact CRM.',
    images: ['/og-image.png'],
    creator: '@travelflow',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  verification: {
    google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
