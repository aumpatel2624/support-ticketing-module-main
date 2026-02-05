/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Turbopack configuration for path aliases
  turbopack: {
    resolveAlias: {
      '@/*': './src/*',
    },
  },
  // Fallback webpack config for non-turbopack builds
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
    };
    return config;
  },
  output: 'export',
  images: {
    unoptimized: true,
  },
  distDir: 'out',
  trailingSlash: false,
};

export default nextConfig;
