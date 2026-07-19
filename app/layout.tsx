import type { Metadata } from 'next';
import { Bebas_Neue, DM_Sans } from 'next/font/google';
import './globals.css';

const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.primelayercoating.com'),
  title: 'Prime Layer Coatings LLC | Professional Painting Services in Las Vegas',
  description:
    'Professional interior, exterior, and cabinet refinishing painting services in Las Vegas. Licensed & insured, free estimates, bilingual team. Call 725-318-1411.',
  keywords:
    'painting services Las Vegas, interior painting, exterior painting, cabinet refinishing, epoxy flooring Las Vegas, licensed insured painters',
  alternates: { canonical: 'https://www.primelayercoating.com/' },
  openGraph: {
    type: 'website',
    siteName: 'Prime Layer Coatings LLC',
    title: 'Prime Layer Coatings LLC | Professional Painting Services in Las Vegas',
    description:
      'Licensed & insured painters serving Las Vegas. Interior, exterior, cabinet refinishing & epoxy flooring. Free estimates — hablamos español.',
    url: 'https://www.primelayercoating.com/',
    locale: 'en_US',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prime Layer Coatings LLC | Professional Painting Services',
    description: 'Licensed & insured painters serving Las Vegas. Free estimates — hablamos español.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/favicon-180.png', sizes: '180x180' }],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HousePainter',
  name: 'Prime Layer Coatings LLC',
  image: 'https://www.primelayercoating.com/og-image.png',
  url: 'https://www.primelayercoating.com/',
  telephone: '+1-725-318-1411',
  email: 'primelayercoating@gmail.com',
  description:
    'Professional interior, exterior, and cabinet refinishing painting services in Las Vegas. Licensed & insured, free estimates, bilingual team.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Las Vegas',
    addressRegion: 'NV',
    addressCountry: 'US',
  },
  areaServed: [
    { '@type': 'City', name: 'Las Vegas' },
    { '@type': 'City', name: 'Henderson' },
    { '@type': 'City', name: 'North Las Vegas' },
    { '@type': 'City', name: 'Summerlin' },
    { '@type': 'City', name: 'Enterprise' },
    { '@type': 'City', name: 'Spring Valley' },
  ],
  sameAs: [
    'https://www.facebook.com/share/1GhCG1cqux/',
    'https://www.instagram.com/primelayercoating',
    'https://www.linkedin.com/in/mirna-enamorado-0b5812421',
    'https://maps.app.goo.gl/CsUzTssUwDDEcki6A',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${bebas.variable} ${dmSans.variable}`}>{children}</body>
    </html>
  );
}
