import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Food Comparison',
  description: 'Compare foods by nutrition, environmental impact, and ethics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 font-[system-ui,sans-serif]">
        <nav className="px-8 py-4 flex gap-6 border-b border-neutral-200 bg-white">
          <a href="/" className="no-underline text-neutral-700 font-medium hover:text-black">Home</a>
          <a href="/foods" className="no-underline text-neutral-700 font-medium hover:text-black">Foods</a>
        </nav>
        <main className="max-w-[960px] mx-auto p-8">{children}</main>
      </body>
    </html>
  );
}
