import { useState, useRef, useCallback } from 'react';
import { Loader2, Upload, Wand2, Clock, Route, Gauge, Mail, X, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useStravaParser } from '@/hooks/useStravaParser';
import { useMissions } from '@/hooks/useMissions';
import { cn } from '@/lib/utils';
import type { Mission } from '@/types/prospection';

interface MissionValidationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mission: Mission;
  onSuccess?: () => void;
}

const MAX_SCREENSHOTS = 3;

export function MissionValidationModal({
  open,
  onOpenChange,
  mission,
  onSuccess,
}: MissionValidationModalProps) {
  const { update } = useMissions();
  const { parseScreenshot, isParsing } = useStravaParser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [screenshots, setScreenshots] = useState<string[]>(mission.strava_screenshots || []);
  const [stravaTempsParts, setStravaTempsParts] = useState(() => {
    // Parse existing strava_temps (format HH:MM:SS ou H:MM:SS)
    if (mission.strava_temps) {
      const parts = mission.strava_temps.split(':');
      return {
        hours: parts[0] || '0',
        minutes: parts[1] || '00',
        seconds: parts[2] || '00',
      };
    }
    return { hours: '0', minutes: '00', seconds: '00' };
  });
  const [stravaDistanceKm, setStravaDistanceKm] = useState<string>(
    mission.strava_distance_km?.toString() || ''
  );
  const [stravaVitesseMoy, setStravaVitesseMoy] = useState<string>(
    mission.strava_vitesse_moy?.toString() || ''
  );
  const [courriersDistribues, setCourriersDistribues] = useState<string>(
    mission.courriers_distribues?.toString() || mission.courriers_prevu?.toString() || ''
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Computed temps string
  const stravaTemps = `${stravaTempsParts.hours}:${stravaTempsParts.minutes.padStart(2, '0')}:${stravaTempsParts.seconds.padStart(2, '0')}`;

  // Validation
  const isValid = screenshots.length > 0 && 
    stravaTempsParts.hours !== '' && 
    stravaTempsParts.minutes !== '' &&
    courriersDistribues !== '' && 
    parseInt(courriersDistribues) >= 0;

  // Upload file to storage
  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${mission.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('prospection')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('prospection')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Erreur lors de l\'upload de l\'image');
      return null;
    }
  }, [mission.id]);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = MAX_SCREENSHOTS - screenshots.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_SCREENSHOTS} screenshots`);
      return;
    }
    
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);
    
    try {
      const uploadedUrls: string[] = [];
      for (const file of filesToUpload) {
        const url = await uploadFile(file);
        if (url) uploadedUrls.push(url);
      }
      
      setScreenshots(prev => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploadée(s)`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove screenshot
  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  // Parse with AI
  const handleParseWithAI = async () => {
    if (screenshots.length === 0) {
      toast.error('Uploadez d\'abord une image Strava');
      return;
    }
    
    // Fetch the first image and convert to File
    try {
      const response = await fetch(screenshots[0]);
      const blob = await response.blob();
      const file = new File([blob], 'strava-screenshot.jpg', { type: blob.type });
      
      const result = await parseScreenshot(file);
      
      if (result && result.valid) {
        // Update form with parsed data
        if (result.temps) {
          const parts = result.temps.split(':');
          setStravaTempsParts({
            hours: parts[0] || '0',
            minutes: parts[1] || '00',
            seconds: parts[2] || '00',
          });
        }
        if (result.distance_km) {
          setStravaDistanceKm(result.distance_km.toString());
        }
        if (result.vitesse_moy) {
          setStravaVitesseMoy(result.vitesse_moy.toString());
        }
      } else {
        toast.error('Impossible de lire les données Strava. Saisissez-les manuellement.');
      }
    } catch (err) {
      console.error('Parse error:', err);
      toast.error('Erreur lors de l\'analyse de l\'image');
    }
  };

  // Save validation
  const handleValidate = async () => {
    if (!isValid) return;
    
    setIsSaving(true);
    try {
      update({
        id: mission.id,
        strava_screenshots: screenshots,
        strava_screenshot_url: screenshots[0] || null, // Legacy fallback
        strava_temps: stravaTemps,
        strava_distance_km: stravaDistanceKm ? parseFloat(stravaDistanceKm) : null,
        strava_vitesse_moy: stravaVitesseMoy ? parseFloat(stravaVitesseMoy) : null,
        courriers_distribues: parseInt(courriersDistribues),
        strava_validated: true,
        statut: 'terminee',
      });
      
      toast.success('Mission validée avec succès');
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('Validation error:', err);
      toast.error('Erreur lors de la validation');
    } finally {
      setIsSaving(false);
    }
  };

  // Skip validation - just mark as terminée without strava validation
  const handleSkipValidation = () => {
    update({
      id: mission.id,
      statut: 'terminee',
      strava_validated: false,
    });
    toast.info('Mission terminée sans validation Strava');
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Valider la mission
          </DialogTitle>
          <DialogDescription>
            Uploadez les preuves Strava et confirmez les données pour valider cette mission.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Screenshots Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Screenshots Strava *</Label>
            
            {/* Upload zone */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                screenshots.length >= MAX_SCREENSHOTS 
                  ? "border-muted bg-muted/30 cursor-not-allowed" 
                  : "border-primary/30 hover:border-primary hover:bg-primary/5"
              )}
              onClick={() => screenshots.length < MAX_SCREENSHOTS && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={screenshots.length >= MAX_SCREENSHOTS}
              />
              {isUploading ? (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Upload en cours...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 py-2">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {screenshots.length >= MAX_SCREENSHOTS 
                      ? `Maximum ${MAX_SCREENSHOTS} images atteint`
                      : `Cliquez pour ajouter (${screenshots.length}/${MAX_SCREENSHOTS})`
                    }
                  </span>
                </div>
              )}
            </div>

            {/* Screenshot gallery */}
            {screenshots.length > 0 && (
              <div className={cn(
                "grid gap-2",
                screenshots.length === 1 ? "grid-cols-1" : screenshots.length === 2 ? "grid-cols-2" : "grid-cols-3"
              )}>
                {screenshots.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(index)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Parse with AI button */}
            {screenshots.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleParseWithAI}
                disabled={isParsing}
                className="w-full"
              >
                {isParsing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Extraire les données avec l'IA
              </Button>
            )}
          </div>

          {/* Strava Data */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {/* Temps */}
              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Temps total *
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    placeholder="H"
                    className="w-16 text-center"
                    value={stravaTempsParts.hours}
                    onChange={(e) => setStravaTempsParts(prev => ({ ...prev, hours: e.target.value }))}
                  />
                  <span>:</span>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="MM"
                    className="w-16 text-center"
                    value={stravaTempsParts.minutes}
                    onChange={(e) => setStravaTempsParts(prev => ({ ...prev, minutes: e.target.value.padStart(2, '0') }))}
                  />
                  <span>:</span>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="SS"
                    className="w-16 text-center"
                    value={stravaTempsParts.seconds}
                    onChange={(e) => setStravaTempsParts(prev => ({ ...prev, seconds: e.target.value.padStart(2, '0') }))}
                  />
                </div>
              </div>

              {/* Distance et vitesse */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm flex items-center gap-1.5">
                    <Route className="h-3.5 w-3.5" />
                    Distance (km)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="12.5"
                    value={stravaDistanceKm}
                    onChange={(e) => setStravaDistanceKm(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm flex items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5" />
                    Vitesse moy (km/h)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="5.2"
                    value={stravaVitesseMoy}
                    onChange={(e) => setStravaVitesseMoy(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Courriers distribués */}
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Courriers distribués *
            </Label>
            <Input
              type="number"
              min="0"
              placeholder={mission.courriers_prevu?.toString() || '0'}
              value={courriersDistribues}
              onChange={(e) => setCourriersDistribues(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Prévus : {mission.courriers_prevu}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleValidate}
              disabled={!isValid || isSaving}
              className="w-full"
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Valider la mission
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSkipValidation}
              className="text-muted-foreground"
            >
              Terminer sans validation Strava
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
