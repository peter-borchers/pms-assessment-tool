import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PMS Assessment',
  description: 'Performance Management System Assessment Tool',
  icons: {
    icon: '/pms-asssess-icon2.png',
    apple: '/pms-asssess-icon2.png',
  },
  openGraph: {
    images: [
      {
        url: '/pms-asssess-icon2.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: '/pms-asssess-icon2.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
