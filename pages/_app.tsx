import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import { useEffect } from 'react';

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const theme = saved || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
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
      fetch('/api/status', { method: 'POST' });
    }, 30000);
    fetch('/api/status', { method: 'POST' });
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Head>{null}</Head>
      <Script src="https://cdn.jsdelivr.net/npm/chart.js"></Script>
      <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></Script>
      <Script src="https://unpkg.com/leaflet.heat/dist/leaflet-heat.js"></Script>
      <Component {...pageProps} />
    </>
  );
}
