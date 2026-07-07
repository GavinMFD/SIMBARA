import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Eksperimen
  experimental: {
    // Aktifkan jika menggunakan server actions
    // serverActions: true,
  },

  // Konfigurasi gambar jika menggunakan external image
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
