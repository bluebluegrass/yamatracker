'use client';

import { useRef, useState } from 'react';
import QRCode from 'qrcode';

interface ShareImageGeneratorProps {
  username: string;
  completedCount: number;
  profileUrl: string;
}

export default function ShareImageGenerator({ 
  username, 
  completedCount, 
  profileUrl 
}: ShareImageGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const shareProgress = async () => {
    if (!canvasRef.current) {
      return;
    }

    setIsGenerating(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      // Set canvas size with higher resolution for crisp text
      const scale = 2; // 2x resolution for sharp text
      canvas.width = 800 * scale;
      canvas.height = 700 * scale;
      
      // Scale the context to match the device pixel ratio
      ctx.scale(scale, scale);
      
      // Enable text rendering optimizations
      ctx.textBaseline = 'top';
      ctx.imageSmoothingEnabled = false;
      
      // Set canvas style for crisp rendering
      canvas.style.width = '800px';
      canvas.style.height = '700px';

      // Background
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);

      // Main container
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(40, 40, 720, 620);
      
      // Border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, 720, 620);

      // Title
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${username}'s Mountain Journey`, 400, 120);

      // Progress text
      ctx.fillStyle = '#6b7280';
      ctx.font = '24px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${completedCount}/100 Mountains Completed`, 400, 180);

      // Progress bar background
      const progressBarWidth = 400;
      const progressBarHeight = 20;
      const progressBarX = 200;
      const progressBarY = 220;

      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

      // Progress bar fill
      const progress = completedCount / 100;
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight);

      // Stats
      ctx.fillStyle = '#374151';
      ctx.font = '20px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';

      const statsY = 300;
      ctx.fillText(`Progress: ${Math.round(progress * 100)}%`, 400, statsY);
      ctx.fillText(`Remaining: ${100 - completedCount}`, 400, statsY + 30);

      // Generate QR code
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(profileUrl, {
          width: 120,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Draw QR code
        const qrImage = new Image();
        qrImage.onload = () => {
          ctx.drawImage(qrImage, 340, 380, 120, 120);
          
          // QR code label
          ctx.fillStyle = '#6b7280';
          ctx.font = '14px system-ui, -apple-system, sans-serif';
          ctx.fillText('Scan to visit profile', 400, 520);
          
          // Call-to-action
          ctx.fillStyle = '#3b82f6';
          ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
          ctx.fillText('Start your journey at hyakumeizan-tracker.com', 400, 560);
          
          // Download the image with high quality
          const link = document.createElement('a');
          link.download = `${username}-mountain-progress.png`;
          link.href = canvas.toDataURL('image/png', 1.0); // Maximum quality
          link.click();
        };
        qrImage.src = qrCodeDataUrl;
      } catch (error) {
        console.error('Error generating QR code:', error);
        // Fallback: download without QR code
        const link = document.createElement('a');
        link.download = `${username}-mountain-progress.png`;
        link.href = canvas.toDataURL('image/png', 1.0); // Maximum quality
        link.click();
      }
      
    } catch (error) {
      console.error('Error generating share image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="text-center">
      <canvas
        ref={canvasRef}
        className="hidden"
        style={{ display: 'none' }}
      />

      <button
        onClick={shareProgress}
        disabled={isGenerating}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? 'Creating...' : 'Share your progress'}
      </button>

      <p className="text-sm text-gray-600 mt-2">
        Download a shareable image with your mountain progress and QR code
      </p>
    </div>
  );
}