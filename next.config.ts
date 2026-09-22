import type { NextConfig } from "next";

/**
 * Extra origins the **development** server accepts cross-origin requests from.
 *
 * Needed only when testing on a phone: the phone loads the dev server over the laptop's
 * LAN address, which Next treats as cross-origin unless it is listed here. The option is
 * read by `next dev` alone and has no effect on a production build, so nothing about
 * production security depends on it.
 *
 * Override per machine without editing this file:
 *   DEV_ALLOWED_ORIGINS=192.168.1.50,my-laptop.local npm run dev
 */
const devAllowedOrigins = (process.env.DEV_ALLOWED_ORIGINS ?? "192.168.2.220")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const nextConfig: NextConfig = {
  allowedDevOrigins: devAllowedOrigins,
};

export default nextConfig;
