import type { AppProps } from 'next/app';
import '@unocss/reset/tailwind.css';
import 'uno.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
