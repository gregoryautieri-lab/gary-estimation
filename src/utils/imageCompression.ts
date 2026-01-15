// ============================================
// Utilitaire de compression d'images
// Optimisation avant upload vers Storage
// ============================================

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  mimeType: 'image/jpeg'
};

/**
 * Compresse une image File et retourne un nouveau File compressé
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Si ce n'est pas une image, retourner tel quel
  if (!file.type.startsWith('image/')) {
    return file;
  }
  
  // Si l'image est déjà petite (< 500KB), pas de compression
  if (file.size < 500 * 1024) {
    return file;
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const { width, height } = calculateDimensions(
            img.width,
            img.height,
            opts.maxWidth!,
            opts.maxHeight!
          );
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }
          
          // Dessiner l'image redimensionnée
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convertir en blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              
              // Créer un nouveau File
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, '.jpg'),
                { type: opts.mimeType, lastModified: Date.now() }
              );
              
              // Si le fichier compressé est plus gros, retourner l'original
              if (compressedFile.size >= file.size) {
                resolve(file);
                return;
              }
              
              console.log(
                `Image compressée: ${formatBytes(file.size)} → ${formatBytes(compressedFile.size)} ` +
                `(${Math.round((1 - compressedFile.size / file.size) * 100)}% de réduction)`
              );
              
              resolve(compressedFile);
            },
            opts.mimeType,
            opts.quality
          );
        } catch (err) {
          console.error('Erreur compression:', err);
          resolve(file);
        }
      };
      
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Compresse plusieurs images en parallèle
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  const results = await Promise.all(
    files.map(file => compressImage(file, options))
  );
  return results;
}

/**
 * Calcule les dimensions en conservant le ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;
  
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }
  
  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }
  
  return { width, height };
}

/**
 * Formate la taille en bytes en format lisible
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Génère une miniature pour affichage rapide
 */
export async function generateThumbnail(
  file: File,
  size: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        
        // Crop carré centré
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        
        canvas.width = size;
        canvas.height = size;
        
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Erreur lecture fichier'));
    reader.readAsDataURL(file);
  });
}

/**
 * Vérifie si un fichier est une image valide
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  return validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.heic');
}

/**
 * Extrait les métadonnées EXIF basiques (orientation)
 */
export async function getImageOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const view = new DataView(e.target?.result as ArrayBuffer);
      
      if (view.getUint16(0, false) !== 0xFFD8) {
        resolve(1); // Pas un JPEG
        return;
      }
      
      const length = view.byteLength;
      let offset = 2;
      
      while (offset < length) {
        if (view.getUint16(offset + 2, false) <= 8) {
          resolve(1);
          return;
        }
        
        const marker = view.getUint16(offset, false);
        offset += 2;
        
        if (marker === 0xFFE1) {
          if (view.getUint32(offset += 2, false) !== 0x45786966) {
            resolve(1);
            return;
          }
          
          const little = view.getUint16(offset += 6, false) === 0x4949;
          offset += view.getUint32(offset + 4, little);
          const tags = view.getUint16(offset, little);
          offset += 2;
          
          for (let i = 0; i < tags; i++) {
            if (view.getUint16(offset + i * 12, little) === 0x0112) {
              resolve(view.getUint16(offset + i * 12 + 8, little));
              return;
            }
          }
        } else if ((marker & 0xFF00) !== 0xFF00) {
          break;
        } else {
          offset += view.getUint16(offset, false);
        }
      }
      
      resolve(1);
    };
    
    reader.onerror = () => resolve(1);
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
  });
}
