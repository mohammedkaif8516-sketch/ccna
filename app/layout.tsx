import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CCNA Notes · Personal Study Guide',
  description: 'A focused, practical reference for learning CCNA networking concepts.',
  generator: 'VB',
}

// Theme used when the visitor has never toggled. Ignores the device setting.
// Change to 'light' if you prefer a light default.
const DEFAULT_THEME = 'dark'

export const viewport: Viewport = {
  colorScheme: 'light dark',
  // Single theme-color (not media-based) so the browser toolbar follows YOUR
  // toggle, not the device. The script below + use-theme.ts keep it updated.
  themeColor: DEFAULT_THEME === 'dark' ? '#0a0a0a' : '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = '${DEFAULT_THEME}';
                try {
                  var stored = localStorage.getItem('ccna:theme');
                  if (stored === 'light' || stored === 'dark') theme = stored;
                } catch (e) {}
                var root = document.documentElement;
                root.classList.remove('light', 'dark');
                root.classList.add(theme);
                root.style.colorScheme = theme;
                var setMeta = function() {
                  var m = document.querySelector('meta[name="theme-color"]');
                  if (m) m.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#ffffff');
                };
                setMeta();
                document.addEventListener('DOMContentLoaded', setMeta);
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
