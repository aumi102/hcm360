import QRCode from 'qrcode';

interface QrCodeProps {
  url: string;
  /** Rendered size in CSS pixels. */
  size?: number;
  className?: string;
}

/**
 * Server-rendered QR code.
 *
 * Generated as inline SVG on the server so the projector shows a crisp, correctly sized
 * code in the first paint — with no client library, no canvas, and nothing to go wrong
 * in the thirty seconds when the whole class is trying to scan it.
 *
 * Error-correction level M tolerates a projector's glare and keystone distortion while
 * keeping the module count low enough to scan from the back rows.
 */
export async function QrCode({ url, size = 280, className }: QrCodeProps) {
  const svg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    width: size,
    color: {
      dark: '#1c1a17',
      light: '#fbf8f1',
    },
  });

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      // The SVG is produced by the QR library from a URL this server built; no user
      // input reaches the markup.
      dangerouslySetInnerHTML={{ __html: svg }}
      aria-label={`Mã QR dẫn tới ${url}`}
      role="img"
    />
  );
}
