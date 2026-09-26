import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vfuwysgwpswsyufyoayh.supabase.co",
        pathname: "/storage/v1/object/public/Media/**",
      },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
