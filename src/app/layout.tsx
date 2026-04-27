import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'con Firma - Invitaciones para bodas',
  description: 'Gestiona invitaciones, confirmaciones y respuestas de invitados por WhatsApp.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn(
        'min-h-screen font-sans antialiased',
        inter.className
      )}>
        {children}
      </body>
    </html>
  );
}
