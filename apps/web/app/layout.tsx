import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Food Comparison',
  description: 'Compare foods by nutrition, environmental impact, and ethics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 font-[system-ui,sans-serif]">
        <nav className="px-4 md:px-8 py-4 flex gap-6 border-b border-neutral-200 bg-white">
          <Link href="/" className="no-underline text-neutral-700 font-medium hover:text-black">Home</Link>
          <Link href="/foods" className="no-underline text-neutral-700 font-medium hover:text-black">Foods</Link>
        </nav>
        <main className="max-w-[1400px] mx-auto p-4 md:p-8">{children}</main>
      </body>
    </html>
  );
}
