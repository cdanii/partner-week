/** @type {import("next").NextConfig} */
const nextConfig = {
  // output: "export", // Uncomment if static export is needed (Vercel usually handles default)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, 
  }
};

export default nextConfig;
