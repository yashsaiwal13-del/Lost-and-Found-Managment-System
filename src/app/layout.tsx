import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CampusFind | College Lost & Found Management System',
  description:
    'CampusFind connects students, faculty, and campus security in one transparent hub to report lost belongings, log found items, and safely verify claims.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} scroll-smooth`}>
      <body className="antialiased min-h-screen flex flex-col font-sans bg-white text-slate-900">
        {children}
      </body>
    </html>
  );
}
