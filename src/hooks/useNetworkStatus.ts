import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pour détecter l'état de la connexion réseau
 * Retourne true si online, false si offline
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [effectiveType, setEffectiveType] = useState<string | null>(null);

  const updateConnectionInfo = useCallback(() => {
    // @ts-ignore - NetworkInformation API pas encore dans les types TS
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      setConnectionType(connection.type || null);
      setEffectiveType(connection.effectiveType || null);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      updateConnectionInfo();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Écouter les changements de connexion (4G → 3G, etc.)
    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo);
      updateConnectionInfo();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, [updateConnectionInfo]);

  // Retourne si la connexion est "lente" (2G, slow-2g)
  const isSlowConnection = effectiveType === 'slow-2g' || effectiveType === '2g';
  
  return {
    isOnline,
    isSlowConnection,
    connectionType,
    effectiveType
  };
}
