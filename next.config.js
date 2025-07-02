import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config) => config;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withBundleAnalyzer(nextConfig);
  