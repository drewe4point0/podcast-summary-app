import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Podcast Summary',
  description: 'Get AI-powered summaries of your favorite podcasts',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
