import { Html, Head, Main, NextScript } from 'next/document';
import { CriticalStyleTag } from '@/lib/critical-css';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Inline critical CSS for fast initial paint */}
        <CriticalStyleTag />
        
        {/* Preconnect to origins for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 