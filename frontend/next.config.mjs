import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'n9ukziiprpemarxa.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: ['@metamask/sdk', '@walletconnect/ethereum-provider'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle @metamask/sdk on the server
      config.externals.push('@metamask/sdk');
    } else {
      // Client-side specific config
      config.externals = config.externals || [];
      config.externals.push({ 'thread-stream': 'commonjs thread-stream' });
      config.resolve.alias['@react-native-async-storage/async-storage'] = path.resolve(__dirname, 'empty-module.js');
      config.resolve.alias['porto'] = false;
      config.resolve.alias['porto/internal'] = false;
    }
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};
export default nextConfig;
