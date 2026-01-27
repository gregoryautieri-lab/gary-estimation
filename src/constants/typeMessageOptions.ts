// Options pour le champ "Type de message" des campagnes de prospection
// Organisées par groupe pour utilisation avec <optgroup>

export interface TypeMessageOption {
  value: string;
  label: string;
}

export interface TypeMessageGroup {
  label: string;
  options: TypeMessageOption[];
}

export const TYPE_MESSAGE_GROUPS: TypeMessageGroup[] = [
  {
    label: 'Ventes',
    options: [
      { value: 'nous_avons_vendu', label: 'Nous avons vendu' },
      { value: 'bientot_en_vente', label: 'Nous avons bientôt en vente' },
      { value: 'nous_avons_en_vente', label: 'Nous avons en vente' },
    ],
  },
  {
    label: 'Recherche',
    options: [
      { value: 'nous_avons_clients', label: 'Nous avons des clients' },
      { value: 'nous_recherchons', label: 'Nous recherchons' },
      { value: 'mandat_recherche', label: 'Mandat de recherche' },
    ],
  },
  {
    label: 'Propositions',
    options: [
      { value: 'proposition_estimation', label: "Proposition d'estimation" },
      { value: 'proposition_switch', label: 'Proposition de Switch' },
    ],
  },
  {
    label: 'Spécial',
    options: [
      { value: 'succession_hoirie', label: 'Succession / Hoirie' },
      { value: 'divorce', label: 'Divorce' },
      { value: 'retraite', label: 'Retraite' },
      { value: 'zone_developpement', label: 'Zone de développement' },
      { value: 'sortie_controle_etatique', label: 'Sortie du contrôle étatique' },
    ],
  },
  {
    label: 'Autres',
    options: [
      { value: 'info_proprietaires', label: 'Information pour propriétaires' },
      { value: 'flyer', label: 'Flyer' },
    ],
  },
];

// Flat list de toutes les options pour lookup rapide
export const ALL_TYPE_MESSAGE_OPTIONS: TypeMessageOption[] = TYPE_MESSAGE_GROUPS.flatMap(g => g.options);

// Helper pour obtenir le label d'une valeur
export function getTypeMessageLabel(value: string | null | undefined): string {
  if (!value) return '—';
  const option = ALL_TYPE_MESSAGE_OPTIONS.find(o => o.value === value);
  return option?.label || value;
}
