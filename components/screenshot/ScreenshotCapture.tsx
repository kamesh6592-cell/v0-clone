'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Camera, Download, Upload, Trash2, Copy } from 'lucide-react';

interface ScreenshotCaptureProps {
  onScreenshotTaken?: (file: File, dataUrl: string) => void;
  onFileUpload?: (files: File[]) => void;
}

export function ScreenshotCapture({ onScreenshotTaken, onFileUpload }: ScreenshotCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [screenshots, setScreenshots] = useState<Array<{ file: File; dataUrl: string; timestamp: Date }>>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const captureScreenshot = useCallback(async () => {
    setIsCapturing(true);
    
    try {
      // Check if screen capture is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen capture not supported in this browser');
      }

      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } as any
      });

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Wait for video to load
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not create canvas context');
      }

      ctx.drawImage(video, 0, 0);

      // Stop the stream
      stream.getTracks().forEach(track => track.stop());

      // Convert to blob
      const dataUrl = canvas.toDataURL('image/png');
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png');
      });

      // Create file
      const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' });

      // Add to screenshots list
      const newScreenshot = { file, dataUrl, timestamp: new Date() };
      setScreenshots(prev => [...prev, newScreenshot]);

      // Call callback
      onScreenshotTaken?.(file, dataUrl);

    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      
      // Fallback: show file picker for manual screenshot upload
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } finally {
      setIsCapturing(false);
    }
  }, [onScreenshotTaken]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      // Process uploaded images
      imageFiles.forEach(async (file) => {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        const newScreenshot = { file, dataUrl, timestamp: new Date() };
        setScreenshots(prev => [...prev, newScreenshot]);
      });

      onFileUpload?.(imageFiles);
    }

    // Reset input
    event.target.value = '';
  };

  const downloadScreenshot = (screenshot: { file: File; dataUrl: string }) => {
    const a = document.createElement('a');
    a.href = screenshot.dataUrl;
    a.download = screenshot.file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyToClipboard = async (screenshot: { file: File; dataUrl: string }) => {
    try {
      // Try to copy as blob first (works better in modern browsers)
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': screenshot.file
        })
      ]);
      console.log('Screenshot copied to clipboard');
    } catch (error) {
      // Fallback: copy data URL
      try {
        await navigator.clipboard.writeText(screenshot.dataUrl);
        console.log('Screenshot URL copied to clipboard');
      } catch (fallbackError) {
        console.error('Failed to copy to clipboard:', fallbackError);
      }
    }
  };

  const deleteScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Screenshot
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Screenshots & Images
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto">
            <div className="flex gap-2">
              <Button
                onClick={captureScreenshot}
                disabled={isCapturing}
                className="flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                {isCapturing ? 'Capturing...' : 'Capture Screen'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Image
              </Button>
            </div>

            {screenshots.length === 0 ? (
              <div className="text-center py-8">
                <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">No screenshots yet</p>
                <p className="text-sm text-gray-500">Capture your screen or upload an image to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {screenshots.map((screenshot, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <div className="relative group">
                      <img
                        src={screenshot.dataUrl}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => downloadScreenshot(screenshot)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => copyToClipboard(screenshot)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteScreenshot(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate">{screenshot.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {screenshot.timestamp.toLocaleString()} • {(screenshot.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Component to manage screenshot state globally
export function ScreenshotStateManager({
  uploadedFiles,
  imageDataList,
  setUploadedFiles,
  setImageDataList,
}: {
  uploadedFiles: File[];
  imageDataList: string[];
  setUploadedFiles?: (files: File[]) => void;
  setImageDataList?: (dataList: string[]) => void;
}) {
  // Make these available globally for other components
  if (typeof window !== 'undefined') {
    (window as any).__BOLT_UPLOADED_FILES__ = uploadedFiles;
    (window as any).__BOLT_IMAGE_DATA_LIST__ = imageDataList;
    (window as any).__BOLT_SET_UPLOADED_FILES__ = setUploadedFiles;
    (window as any).__BOLT_SET_IMAGE_DATA_LIST__ = setImageDataList;
  }

  return null;
}