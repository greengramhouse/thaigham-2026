import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ตั้งค่าอนุญาตให้โดเมนรูปภาพภายนอกทำงานได้
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // โดเมนของ Cloudinary
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // รูปโปรไฟล์จาก Google
        port: "",
        pathname: "/**",
      },
    ],
  },
};


export default nextConfig;
