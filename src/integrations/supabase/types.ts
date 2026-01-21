export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      campagnes: {
        Row: {
          code: string | null
          commune: string
          courtier_id: string
          cout_total: number
          cout_unitaire_courrier: number | null
          cout_unitaire_flyer: number
          created_at: string
          date_debut: string | null
          date_fin: string | null
          id: string
          nb_courriers: number
          nb_estimations: number
          nb_flyers: number
          nb_mandats: number
          nb_prospects: number
          notes: string | null
          qr_destination_url: string | null
          qr_image_url: string | null
          scans_count: number
          secteurs: string[] | null
          statut: Database["public"]["Enums"]["campagne_statut"]
          support_id: string
          type_bien: Database["public"]["Enums"]["type_bien_prospection"]
          uniqode_id: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          commune: string
          courtier_id: string
          cout_total?: number
          cout_unitaire_courrier?: number | null
          cout_unitaire_flyer?: number
          created_at?: string
          date_debut?: string | null
          date_fin?: string | null
          id?: string
          nb_courriers?: number
          nb_estimations?: number
          nb_flyers?: number
          nb_mandats?: number
          nb_prospects?: number
          notes?: string | null
          qr_destination_url?: string | null
          qr_image_url?: string | null
          scans_count?: number
          secteurs?: string[] | null
          statut?: Database["public"]["Enums"]["campagne_statut"]
          support_id: string
          type_bien?: Database["public"]["Enums"]["type_bien_prospection"]
          uniqode_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          commune?: string
          courtier_id?: string
          cout_total?: number
          cout_unitaire_courrier?: number | null
          cout_unitaire_flyer?: number
          created_at?: string
          date_debut?: string | null
          date_fin?: string | null
          id?: string
          nb_courriers?: number
          nb_estimations?: number
          nb_flyers?: number
          nb_mandats?: number
          nb_prospects?: number
          notes?: string | null
          qr_destination_url?: string | null
          qr_image_url?: string | null
          scans_count?: number
          secteurs?: string[] | null
          statut?: Database["public"]["Enums"]["campagne_statut"]
          support_id?: string
          type_bien?: Database["public"]["Enums"]["type_bien_prospection"]
          uniqode_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campagnes_support_id_fkey"
            columns: ["support_id"]
            isOneToOne: false
            referencedRelation: "supports_prospection"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_objectives: {
        Row: {
          amount: number
          courtier_name: string | null
          created_at: string
          id: string
          type: string
          updated_at: string
          year: number
        }
        Insert: {
          amount?: number
          courtier_name?: string | null
          created_at?: string
          id?: string
          type: string
          updated_at?: string
          year: number
        }
        Update: {
          amount?: number
          courtier_name?: string | null
          created_at?: string
          id?: string
          type?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      commissions: {
        Row: {
          adresse: string
          commission_totale: number
          commune: string | null
          courtier_principal: string
          courtier_principal_email: string | null
          created_at: string
          date_paiement: string | null
          date_signature: string | null
          deleted_at: string | null
          estimation_id: string | null
          id: string
          notes: string | null
          origine: string | null
          origine_detail: string | null
          prix_vente: number
          repartition: Json | null
          statut: string
          updated_at: string
        }
        Insert: {
          adresse: string
          commission_totale: number
          commune?: string | null
          courtier_principal: string
          courtier_principal_email?: string | null
          created_at?: string
          date_paiement?: string | null
          date_signature?: string | null
          deleted_at?: string | null
          estimation_id?: string | null
          id?: string
          notes?: string | null
          origine?: string | null
          origine_detail?: string | null
          prix_vente: number
          repartition?: Json | null
          statut?: string
          updated_at?: string
        }
        Update: {
          adresse?: string
          commission_totale?: number
          commune?: string | null
          courtier_principal?: string
          courtier_principal_email?: string | null
          created_at?: string
          date_paiement?: string | null
          date_signature?: string | null
          deleted_at?: string | null
          estimation_id?: string | null
          id?: string
          notes?: string | null
          origine?: string | null
          origine_detail?: string | null
          prix_vente?: number
          repartition?: Json | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_estimation_id_fkey"
            columns: ["estimation_id"]
            isOneToOne: false
            referencedRelation: "estimations"
            referencedColumns: ["id"]
          },
        ]
      }
      comparables: {
        Row: {
          acheteurs: string | null
          adresse: string | null
          code_postal: string | null
          created_at: string
          date_vente: string | null
          id: string
          images: string[] | null
          latitude: number | null
          localite: string | null
          longitude: number | null
          notes: string | null
          pieces: number | null
          prix: number | null
          source: string | null
          statut_marche: string
          strategie_diffusion: string | null
          surface: number | null
          surface_parcelle: number | null
          type_bien: Database["public"]["Enums"]["type_bien"] | null
          updated_at: string
          url_source: string | null
          user_id: string
          vendeurs: string | null
        }
        Insert: {
          acheteurs?: string | null
          adresse?: string | null
          code_postal?: string | null
          created_at?: string
          date_vente?: string | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          localite?: string | null
          longitude?: number | null
          notes?: string | null
          pieces?: number | null
          prix?: number | null
          source?: string | null
          statut_marche?: string
          strategie_diffusion?: string | null
          surface?: number | null
          surface_parcelle?: number | null
          type_bien?: Database["public"]["Enums"]["type_bien"] | null
          updated_at?: string
          url_source?: string | null
          user_id: string
          vendeurs?: string | null
        }
        Update: {
          acheteurs?: string | null
          adresse?: string | null
          code_postal?: string | null
          created_at?: string
          date_vente?: string | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          localite?: string | null
          longitude?: number | null
          notes?: string | null
          pieces?: number | null
          prix?: number | null
          source?: string | null
          statut_marche?: string
          strategie_diffusion?: string | null
          surface?: number | null
          surface_parcelle?: number | null
          type_bien?: Database["public"]["Enums"]["type_bien"] | null
          updated_at?: string
          url_source?: string | null
          user_id?: string
          vendeurs?: string | null
        }
        Relationships: []
      }
      estimation_modifications: {
        Row: {
          action: string
          estimation_id: string
          field: string
          id: string
          module: string
          new_value: Json | null
          old_value: Json | null
          timestamp: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action?: string
          estimation_id: string
          field: string
          id?: string
          module: string
          new_value?: Json | null
          old_value?: Json | null
          timestamp?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          estimation_id?: string
          field?: string
          id?: string
          module?: string
          new_value?: Json | null
          old_value?: Json | null
          timestamp?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimation_modifications_estimation_id_fkey"
            columns: ["estimation_id"]
            isOneToOne: false
            referencedRelation: "estimations"
            referencedColumns: ["id"]
          },
        ]
      }
      estimation_status_history: {
        Row: {
          comment: string | null
          duration_in_previous_status: number | null
          estimation_id: string
          id: string
          previous_status: string | null
          status: string
          timestamp: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          comment?: string | null
          duration_in_previous_status?: number | null
          estimation_id: string
          id?: string
          previous_status?: string | null
          status: string
          timestamp?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          comment?: string | null
          duration_in_previous_status?: number | null
          estimation_id?: string
          id?: string
          previous_status?: string | null
          status?: string
          timestamp?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimation_status_history_estimation_id_fkey"
            columns: ["estimation_id"]
            isOneToOne: false
            referencedRelation: "estimations"
            referencedColumns: ["id"]
          },
        ]
      }
      estimation_versions: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_id: string | null
          estimation_id: string
          id: string
          label: string | null
          snapshot: Json
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_id?: string | null
          estimation_id: string
          id?: string
          label?: string | null
          snapshot: Json
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_id?: string | null
          estimation_id?: string
          id?: string
          label?: string | null
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimation_versions_estimation_id_fkey"
            columns: ["estimation_id"]
            isOneToOne: false
            referencedRelation: "estimations"
            referencedColumns: ["id"]
          },
        ]
      }
      estimations: {
        Row: {
          adresse: string | null
          analyse_terrain: Json | null
          campagne_origin_code: string | null
          caracteristiques: Json | null
          code_postal: string | null
          comparables: Json | null
          courtier_id: string
          created_at: string
          etapes_completees: string[] | null
          historique: Json | null
          id: string
          identification: Json | null
          localite: string | null
          notes_libres: string | null
          photos: Json | null
          pre_estimation: Json | null
          prix_final: number | null
          prix_max: number | null
          prix_min: number | null
          statut: Database["public"]["Enums"]["estimation_status"]
          strategie: Json | null
          timeline: Json | null
          type_bien: Database["public"]["Enums"]["type_bien"] | null
          updated_at: string
          vendeur_email: string | null
          vendeur_nom: string | null
          vendeur_telephone: string | null
        }
        Insert: {
          adresse?: string | null
          analyse_terrain?: Json | null
          campagne_origin_code?: string | null
          caracteristiques?: Json | null
          code_postal?: string | null
          comparables?: Json | null
          courtier_id: string
          created_at?: string
          etapes_completees?: string[] | null
          historique?: Json | null
          id?: string
          identification?: Json | null
          localite?: string | null
          notes_libres?: string | null
          photos?: Json | null
          pre_estimation?: Json | null
          prix_final?: number | null
          prix_max?: number | null
          prix_min?: number | null
          statut?: Database["public"]["Enums"]["estimation_status"]
          strategie?: Json | null
          timeline?: Json | null
          type_bien?: Database["public"]["Enums"]["type_bien"] | null
          updated_at?: string
          vendeur_email?: string | null
          vendeur_nom?: string | null
          vendeur_telephone?: string | null
        }
        Update: {
          adresse?: string | null
          analyse_terrain?: Json | null
          campagne_origin_code?: string | null
          caracteristiques?: Json | null
          code_postal?: string | null
          comparables?: Json | null
          courtier_id?: string
          created_at?: string
          etapes_completees?: string[] | null
          historique?: Json | null
          id?: string
          identification?: Json | null
          localite?: string | null
          notes_libres?: string | null
          photos?: Json | null
          pre_estimation?: Json | null
          prix_final?: number | null
          prix_max?: number | null
          prix_min?: number | null
          statut?: Database["public"]["Enums"]["estimation_status"]
          strategie?: Json | null
          timeline?: Json | null
          type_bien?: Database["public"]["Enums"]["type_bien"] | null
          updated_at?: string
          vendeur_email?: string | null
          vendeur_nom?: string | null
          vendeur_telephone?: string | null
        }
        Relationships: []
      }
      etudiants: {
        Row: {
          actif: boolean
          created_at: string
          email: string | null
          id: string
          nom: string | null
          prenom: string
          salaire_horaire: number
          tel: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          actif?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nom?: string | null
          prenom: string
          salaire_horaire?: number
          tel?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          actif?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nom?: string | null
          prenom?: string
          salaire_horaire?: number
          tel?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      missions: {
        Row: {
          campagne_id: string
          courriers_distribues: number | null
          courriers_prevu: number
          courtier_id: string | null
          created_at: string
          date: string
          etudiant_id: string | null
          id: string
          notes: string | null
          secteur_nom: string | null
          statut: Database["public"]["Enums"]["mission_statut"]
          strava_distance_km: number | null
          strava_screenshot_url: string | null
          strava_temps: string | null
          strava_validated: boolean
          strava_vitesse_moy: number | null
          updated_at: string
          zone_geojson: Json | null
          zone_image_url: string | null
        }
        Insert: {
          campagne_id: string
          courriers_distribues?: number | null
          courriers_prevu?: number
          courtier_id?: string | null
          created_at?: string
          date: string
          etudiant_id?: string | null
          id?: string
          notes?: string | null
          secteur_nom?: string | null
          statut?: Database["public"]["Enums"]["mission_statut"]
          strava_distance_km?: number | null
          strava_screenshot_url?: string | null
          strava_temps?: string | null
          strava_validated?: boolean
          strava_vitesse_moy?: number | null
          updated_at?: string
          zone_geojson?: Json | null
          zone_image_url?: string | null
        }
        Update: {
          campagne_id?: string
          courriers_distribues?: number | null
          courriers_prevu?: number
          courtier_id?: string | null
          created_at?: string
          date?: string
          etudiant_id?: string | null
          id?: string
          notes?: string | null
          secteur_nom?: string | null
          statut?: Database["public"]["Enums"]["mission_statut"]
          strava_distance_km?: number | null
          strava_screenshot_url?: string | null
          strava_temps?: string | null
          strava_validated?: boolean
          strava_vitesse_moy?: number | null
          updated_at?: string
          zone_geojson?: Json | null
          zone_image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "missions_campagne_id_fkey"
            columns: ["campagne_id"]
            isOneToOne: false
            referencedRelation: "campagnes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_etudiant_id_fkey"
            columns: ["etudiant_id"]
            isOneToOne: false
            referencedRelation: "etudiants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          telephone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          telephone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          telephone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_comparables_links: {
        Row: {
          comparable_id: string | null
          created_at: string
          estimation_id: string | null
          id: string
          notes: string | null
          project_id: string
          selected_by_user: boolean | null
        }
        Insert: {
          comparable_id?: string | null
          created_at?: string
          estimation_id?: string | null
          id?: string
          notes?: string | null
          project_id: string
          selected_by_user?: boolean | null
        }
        Update: {
          comparable_id?: string | null
          created_at?: string
          estimation_id?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          selected_by_user?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "project_comparables_links_comparable_id_fkey"
            columns: ["comparable_id"]
            isOneToOne: false
            referencedRelation: "comparables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comparables_links_estimation_id_fkey"
            columns: ["estimation_id"]
            isOneToOne: false
            referencedRelation: "estimations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comparables_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_comparables"
            referencedColumns: ["id"]
          },
        ]
      }
      projects_comparables: {
        Row: {
          archived: boolean | null
          communes: string[] | null
          courtier_name: string | null
          created_at: string
          id: string
          last_search_date: string | null
          nb_comparables: number | null
          pieces_max: number | null
          pieces_min: number | null
          prix_max: number | null
          prix_min: number | null
          project_name: string
          statut_filter:
            | Database["public"]["Enums"]["project_statut_filter"]
            | null
          surface_max: number | null
          surface_min: number | null
          type_bien: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          communes?: string[] | null
          courtier_name?: string | null
          created_at?: string
          id?: string
          last_search_date?: string | null
          nb_comparables?: number | null
          pieces_max?: number | null
          pieces_min?: number | null
          prix_max?: number | null
          prix_min?: number | null
          project_name: string
          statut_filter?:
            | Database["public"]["Enums"]["project_statut_filter"]
            | null
          surface_max?: number | null
          surface_min?: number | null
          type_bien?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean | null
          communes?: string[] | null
          courtier_name?: string | null
          created_at?: string
          id?: string
          last_search_date?: string | null
          nb_comparables?: number | null
          pieces_max?: number | null
          pieces_min?: number | null
          prix_max?: number | null
          prix_min?: number | null
          project_name?: string
          statut_filter?:
            | Database["public"]["Enums"]["project_statut_filter"]
            | null
          surface_max?: number | null
          surface_min?: number | null
          type_bien?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supports_prospection: {
        Row: {
          actif: boolean
          created_at: string
          description: string | null
          id: string
          nom: string
          ordre: number
          tarif_unitaire: number
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          ordre?: number
          tarif_unitaire: number
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          ordre?: number
          tarif_unitaire?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "courtier"
        | "back_office"
        | "marketing"
        | "etudiant"
        | "responsable_prospection"
      campagne_statut: "brouillon" | "planifiee" | "en_cours" | "terminee"
      estimation_status:
        | "brouillon"
        | "en_cours"
        | "termine"
        | "archive"
        | "a_presenter"
        | "presentee"
        | "reflexion"
        | "negociation"
        | "accord_oral"
        | "en_signature"
        | "mandat_signe"
        | "perdu"
      mission_statut: "prevue" | "en_cours" | "terminee" | "annulee"
      project_statut_filter: "vendus" | "en_vente" | "tous"
      type_bien:
        | "appartement"
        | "maison"
        | "terrain"
        | "immeuble"
        | "commercial"
      type_bien_prospection: "PPE" | "Villa" | "Mixte"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "courtier",
        "back_office",
        "marketing",
        "etudiant",
        "responsable_prospection",
      ],
      campagne_statut: ["brouillon", "planifiee", "en_cours", "terminee"],
      estimation_status: [
        "brouillon",
        "en_cours",
        "termine",
        "archive",
        "a_presenter",
        "presentee",
        "reflexion",
        "negociation",
        "accord_oral",
        "en_signature",
        "mandat_signe",
        "perdu",
      ],
      mission_statut: ["prevue", "en_cours", "terminee", "annulee"],
      project_statut_filter: ["vendus", "en_vente", "tous"],
      type_bien: ["appartement", "maison", "terrain", "immeuble", "commercial"],
      type_bien_prospection: ["PPE", "Villa", "Mixte"],
    },
  },
} as const
