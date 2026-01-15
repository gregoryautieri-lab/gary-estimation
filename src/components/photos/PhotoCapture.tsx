import React, { useRef, useState } from 'react';
import { Camera, Image, X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PhotoCaptureProps {
  onCapture: (files: File[]) => void;
  disabled?: boolean;
  uploading?: boolean;
}

export function PhotoCapture({ onCapture, disabled, uploading }: PhotoCaptureProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onCapture(files);
    }
    // Reset input
    e.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter(f => 
      f.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      onCapture(files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition-colors",
          dragActive 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50",
          disabled && "opacity-50 pointer-events-none"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Upload en cours...</p>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Glissez-déposez vos photos ici
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ou utilisez les boutons ci-dessous
            </p>
          </>
        )}
      </div>

      {/* Boutons capture */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleCameraClick}
          disabled={disabled || uploading}
          className="h-14 flex-col gap-1"
        >
          <Camera className="h-5 w-5" />
          <span className="text-xs">Prendre photo</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleGalleryClick}
          disabled={disabled || uploading}
          className="h-14 flex-col gap-1"
        >
          <Image className="h-5 w-5" />
          <span className="text-xs">Galerie</span>
        </Button>
      </div>

      {/* Inputs cachés */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
