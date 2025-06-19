import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import '../uno.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PageLoader from '../components/PageLoader';

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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

  // Hide loader once the initial route is ready
  useEffect(() => {
    if (router.isReady) setLoading(false);
  }, [router.isReady]);

  useEffect(() => {
    const start = () => setLoading(true);
    const end = () => setLoading(false);
    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', end);
    router.events.on('routeChangeError', end);
    return () => {
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', end);
      router.events.off('routeChangeError', end);
    };
  }, [router.events]);

  return (
    <>
      <Head>{null}</Head>
      <Script src="https://cdn.jsdelivr.net/npm/chart.js"></Script>
      <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></Script>
      <PageLoader loading={loading} />
      <Component {...pageProps} />
    </>
  );
}
