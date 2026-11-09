import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://playverified.app'),
  title: "PlayVerified | Where performance meets proof",
  description: "Build your athlete profile, track sporting performance, and connect with coaches, schools, and scouts.",
  openGraph: {
    type: 'website',
    siteName: 'PlayVerified',
    title: 'PlayVerified | Where performance meets proof',
    description: 'Build your athlete profile, track sporting performance, and connect with coaches, schools, and scouts.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PlayVerified | Where performance meets proof',
    description: 'Build your athlete profile, track sporting performance, and connect with coaches, schools, and scouts.',
    images: ['/opengraph-image'],
  },
  icons: {
    icon: [{ url: '/brand-icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
