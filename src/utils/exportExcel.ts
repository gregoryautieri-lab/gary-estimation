import * as XLSX from 'xlsx';
import { format } from 'date-fns';

/**
 * Export des données en fichier Excel (.xlsx)
 * @param data - Tableau d'objets à exporter
 * @param filename - Nom du fichier (sans extension)
 * @param sheetName - Nom de l'onglet (optionnel)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToExcel(
  data: any[],
  filename: string,
  sheetName = 'Données'
): void {
  if (data.length === 0) {
    console.warn('Aucune donnée à exporter');
    return;
  }

  // Créer un workbook
  const wb = XLSX.utils.book_new();

  // Créer une feuille de calcul à partir des données
  const ws = XLSX.utils.json_to_sheet(data);

  // Ajouter la feuille au workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Générer le nom de fichier avec la date
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const fullFilename = `${filename}-${dateStr}.xlsx`;

  // Télécharger le fichier
  XLSX.writeFile(wb, fullFilename);
}

/**
 * Formater les données de campagnes pour l'export
 */
export interface CampagneExportRow {
  'Code': string;
  'Date création': string;
  'Statut': string;
  'Courtier': string;
  'Commune': string;
  'Type de bien': string;
  'Type de message': string;
  'Support': string;
  'Nb courriers': number;
  'Nb flyers': number;
  'Coût supports (CHF)': number;
  'Scans QR': number;
  'Notes': string;
}

/**
 * Formater les données de missions pour l'export
 */
export interface MissionExportRow {
  'Code campagne': string;
  'Date': string;
  'Commune': string;
  'Secteur': string;
  'Assigné à': string;
  'Type assigné': string;
  'Statut': string;
  'Courriers prévus': number;
  'Courriers distribués': number;
  'Temps Strava': string;
  'Distance (km)': number | string;
  'Vitesse moy (km/h)': number | string;
  'Validation Strava': string;
}

/**
 * Formater les données de salaires pour l'export
 */
export interface SalaireExportRow {
  'Période': string;
  'Étudiant': string;
  'Nb missions': number;
  'Total heures': string;
  'Taux horaire (CHF)': number;
  'Montant brut (CHF)': number;
  'Statut': string;
}
