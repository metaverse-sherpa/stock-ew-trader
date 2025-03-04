/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|woff2|css|js)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  experimental: {
    optimizeCss: true, // Enable CSS optimization
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for major libraries
          'vendor-charts': ['lightweight-charts'],
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-tabs',
            '@radix-ui/react-switch',
            '@radix-ui/react-label',
            '@radix-ui/react-select'
          ],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  webpack: (config, { isServer }) => {
    // Optimize chunks
    config.optimization.splitChunks = {
      chunks: 'all',
      minSize: 20000,
      maxSize: 90000,
      cacheGroups: {
        default: false,
        vendors: false,
        // Vendor chunk for third-party libraries
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /node_modules/,
          priority: 20,
        },
        // Common chunk for frequently used components
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true,
          enforce: true,
        },
      },
    };
    return config;
  },
};

module.exports = nextConfig; 