import { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, Loader2, Camera, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useStravaParser, parseStravaManual } from '@/hooks/useStravaParser';
import type { StravaData } from '@/types/prospection';
import { cn } from '@/lib/utils';

interface StravaUploaderProps {
  onDataExtracted: (data: StravaData) => void;
  initialData?: StravaData | null;
  disabled?: boolean;
  screenshotUrl?: string | null;
}

export function StravaUploader({ 
  onDataExtracted, 
  initialData, 
  disabled = false,
  screenshotUrl 
}: StravaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { parseScreenshot, isParsing, error } = useStravaParser();
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(screenshotUrl || null);
  const [extractedData, setExtractedData] = useState<StravaData | null>(initialData || null);
  const [isEditing, setIsEditing] = useState(false);
  const [manualData, setManualData] = useState({
    temps: initialData?.temps || '',
    distance_km: initialData?.distance_km?.toString() || '',
    vitesse_moy: initialData?.vitesse_moy?.toString() || initialData?.vitesse_moy_kmh?.toString() || '',
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Parse with AI
    const result = await parseScreenshot(file);
    if (result) {
      setExtractedData(result);
      setManualData({
        temps: result.temps || '',
        distance_km: result.distance_km?.toString() || '',
        vitesse_moy: result.vitesse_moy?.toString() || result.vitesse_moy_kmh?.toString() || '',
      });
      onDataExtracted(result);
    }
  };

  const handleManualSave = () => {
    const data: StravaData = {
      temps: manualData.temps,
      distance_km: parseFloat(manualData.distance_km) || undefined,
      vitesse_moy: parseFloat(manualData.vitesse_moy) || undefined,
    };
    setExtractedData(data);
    onDataExtracted(data);
    setIsEditing(false);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || isParsing}
      />

      {!previewUrl ? (
        <button
          onClick={triggerUpload}
          disabled={disabled || isParsing}
          className={cn(
            "w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 transition-colors",
            disabled 
              ? "border-muted bg-muted/30 cursor-not-allowed" 
              : "border-primary/30 hover:border-primary hover:bg-primary/5 cursor-pointer"
          )}
        >
          {isParsing ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">Analyse en cours...</span>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-primary/10">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium">Capturer le screenshot Strava</p>
                <p className="text-sm text-muted-foreground">L'IA extraira automatiquement les données</p>
              </div>
            </>
          )}
        </button>
      ) : (
        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-muted">
            <img 
              src={previewUrl} 
              alt="Screenshot Strava" 
              className="w-full h-full object-contain"
            />
            {!disabled && (
              <Button
                size="sm"
                variant="secondary"
                className="absolute bottom-2 right-2"
                onClick={triggerUpload}
              >
                <Upload className="h-4 w-4 mr-1" />
                Remplacer
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Extracted Data Display / Edit */}
      {(extractedData || isEditing) && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Données extraites</span>
              </div>
              {!disabled && !isEditing && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Corriger
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="temps">Temps (format: 1h 23min)</Label>
                  <Input
                    id="temps"
                    value={manualData.temps}
                    onChange={(e) => setManualData(prev => ({ ...prev, temps: e.target.value }))}
                    placeholder="1h 23min"
                  />
                </div>
                <div>
                  <Label htmlFor="distance">Distance (km)</Label>
                  <Input
                    id="distance"
                    type="number"
                    step="0.1"
                    value={manualData.distance_km}
                    onChange={(e) => setManualData(prev => ({ ...prev, distance_km: e.target.value }))}
                    placeholder="5.2"
                  />
                </div>
                <div>
                  <Label htmlFor="vitesse">Vitesse moyenne (km/h)</Label>
                  <Input
                    id="vitesse"
                    type="number"
                    step="0.1"
                    value={manualData.vitesse_moy}
                    onChange={(e) => setManualData(prev => ({ ...prev, vitesse_moy: e.target.value }))}
                    placeholder="4.2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleManualSave} className="flex-1">
                    Enregistrer
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {extractedData?.temps || '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">Temps</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {extractedData?.distance_km?.toFixed(1) || '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">km</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {(extractedData?.vitesse_moy || extractedData?.vitesse_moy_kmh)?.toFixed(1) || '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">km/h</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
