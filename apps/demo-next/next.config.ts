import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // The shared playground is published as TypeScript source.
  transpilePackages: ['@floaty/demo-app'],
};

export default config;
