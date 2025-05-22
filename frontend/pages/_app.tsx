import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { initializeTheme } from '@/lib/design-tokens';

// CSS will be loaded via _document.tsx with the critical CSS inlined
// and the non-critical CSS loaded asynchronously

export default function App({ Component, pageProps }: AppProps) {
  // Initialize theme on client side
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Preload important resources */}
        <link 
          rel="preload" 
          href="/fonts/main-font.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
} 