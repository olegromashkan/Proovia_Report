import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import '../uno.css';
import { useEffect } from 'react';

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const theme = saved || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    const vars = [
      '--p',
      '--a',
      '--b1',
      '--b2',
      '--card-bg',
      '--section-bg',
      '--rounded-btn',
      '--rounded-box',
      '--rounded-badge',
      '--shadow-strength',
    ];
    vars.forEach(v => {
      const val = localStorage.getItem('style' + v);
      if (val) document.documentElement.style.setProperty(v, val);
    });

    const interval = setInterval(() => {
      fetch('/api/ping');
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/daisyui@3.9.4/dist/full.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
        />
      </Head>
      <Script src="https://cdn.jsdelivr.net/npm/chart.js"></Script>
      <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></Script>
      <Component {...pageProps} />
    </>
  );
}
