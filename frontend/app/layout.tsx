import "./globals.css";
import type { Metadata } from "next";
import { Lora } from "next/font/google";

const serifFont = Lora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DocuCore AI",
  description: "Document Automation Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${serifFont.variable} font-serif`} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://document-automation-backend-1jte.onrender.com" />
        <link rel="dns-prefetch" href="https://document-automation-backend-1jte.onrender.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}

              // Non-blocking early cloud backend pre-warm on page load
              try {
                if (typeof window !== 'undefined' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                  fetch('https://document-automation-backend-1jte.onrender.com/health', {
                    mode: 'no-cors',
                    cache: 'no-cache',
                    keepalive: true
                  }).catch(function() {});
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className={`${serifFont.className} font-serif antialiased`}>{children}</body>
    </html>
  );
}

