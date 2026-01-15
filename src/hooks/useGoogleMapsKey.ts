import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

let cachedKey: string | null = null;

export const useGoogleMapsKey = () => {
  const [apiKey, setApiKey] = useState<string | null>(cachedKey);
  const [loading, setLoading] = useState(!cachedKey);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedKey) {
      setApiKey(cachedKey);
      setLoading(false);
      return;
    }

    const fetchKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-maps-key");
        
        if (error) {
          throw error;
        }

        if (data?.key) {
          cachedKey = data.key;
          setApiKey(data.key);
        } else {
          throw new Error("No API key returned");
        }
      } catch (err) {
        console.error("Error fetching Google Maps API key:", err);
        setError(err instanceof Error ? err.message : "Failed to load map");
      } finally {
        setLoading(false);
      }
    };

    fetchKey();
  }, []);

  return { apiKey, loading, error };
};
