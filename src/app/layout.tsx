import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Playfair_Display } from 'next/font/google';

import './globals.css';

/**
 * Both families are loaded with the `vietnamese` subset. Without it the browser falls
 * back for any glyph carrying a Vietnamese diacritic, so a single heading ends up set
 * in two typefaces — the most common way a Vietnamese interface looks broken.
 */
const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin', 'vietnamese'],
  weight: ['700', '900'],
  display: 'swap',
});

const beVietnam = Be_Vietnam_Pro({
  variable: '--font-be-vietnam',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ĐẠO ĐỨC 360° — Bạn sẽ chọn gì?',
  description:
    'Trò chơi tương tác trên lớp cho Chủ đề 8, môn Tư tưởng Hồ Chí Minh (HCM202): tư tưởng Hồ Chí Minh về đạo đức và những nguyên tắc xây dựng đạo đức cách mạng.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Zoom stays available: a student may genuinely need to enlarge the text.
  maximumScale: 5,
  themeColor: '#f4efe4',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="vi" className={`${playfair.variable} ${beVietnam.variable} h-full`}>
      <body className="paper-grain relative min-h-full">{children}</body>
    </html>
  );
}
