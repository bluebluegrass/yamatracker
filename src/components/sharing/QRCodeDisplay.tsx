'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  url: string;
  size?: number;
}

export default function QRCodeDisplay({ url, size = 200 }: QRCodeDisplayProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const dataUrl = await QRCode.toDataURL(url, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('Failed to generate QR code');
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      generateQRCode();
    }
  }, [url, size]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="text-gray-500 text-sm">Generating QR code...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <img 
        src={qrCodeDataUrl} 
        alt="QR Code for profile" 
        className="mx-auto border border-gray-200 rounded-lg"
        style={{ width: size, height: size }}
      />
      <p className="text-sm text-gray-600 mt-2">
        Scan to visit profile
      </p>
    </div>
  );
}
