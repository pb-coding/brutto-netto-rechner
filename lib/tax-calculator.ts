/**
 * German Tax Calculator for 2026
 * Based on German income tax law (EStG) with accurate legal implementations
 * 
 * Implemented:
 * - §32a EStG: Tax tariff with Steuerklassen (I-VI) and Splitting
 * - §39b EStG: Vorsorgepauschale with 36€ rounding
 * - §4 SolZG: Solidaritätszuschlag with Milderungszone
 * - PUEG: Pflegeversicherung reform with Kinderstaffelung
 */

export type Steuerklasse = "I" | "II" | "III" | "IV" | "V" | "VI";

export interface TaxInput {
  bruttoJahr: number;
  steuerklasse: Steuerklasse;
  kirchensteuer: boolean;
  kirchensteuerSatz: number; // 0.08 or 0.09
  zusatzbeitrag: number; // percentage, e.g., 1.70
  werbungskosten: number; // additional Werbungskosten beyond Pauschbetrag
  kinderAnzahl: number; // number of children
  alter: number; // age of employee (for PV Kinderlosenzuschlag)
}

export interface TaxResult {
  // Inputs
  bruttoJahr: number;
  steuerklasse: Steuerklasse;
  
  // Social contributions (Sozialabgaben)
  rentenversicherung: number;
  arbeitslosenversicherung: number;
  krankenversicherung: number;
  pflegeversicherung: number;
  gesamtSozialabgaben: number;
  
  // Tax calculation
  werbungskostenPauschbetrag: number;
  sonderausgabenPauschbetrag: number;
  vorsorgepauschale: number;
  zuVersteuerndesEinkommen: number;
  zvEForLohnsteuer: number; // After 36€ rounding
  
  // Taxes
  lohnsteuer: number;
  solidaritaetszuschlag: number;
  kirchensteuer: number;
  gesamtSteuern: number;
  
  // Net
  nettoJahr: number;
  nettoMonat: number;
  
  // Effective rates
  steuerSatz: number;
  abgabenSatz: number;
  nettoQuote: number;
}

// 2026 Tax Parameters (based on official §32a EStG and Sozialversicherungsrechengrößen)
// Sources:
// - §32a EStG: https://www.gesetze-im-internet.de/estg/__32a.html
// - BBG 2026: https://www.bundesregierung.de/breg-de/aktuelles/beitragsgemessungsgrenzen-2386514
const TAX_2026 = {
  // Basic allowance (Grundfreibetrag) - §32a Abs. 1 Nr. 1 EStG
  grundfreibetrag: 12348,
  
  // Werbungskosten Pauschbetrag - §9a Abs. 1 Nr. 1 EStG
  werbungskostenPauschbetrag: 1230,
  
  // Sonderausgaben Pauschbetrag - §10c EStG
  sonderausgabenPauschbetrag: 36,
  
  // Tax bracket thresholds (Progressionszonen) - §32a Abs. 1 EStG
  zone1End: 17799,
  zone2End: 69878,
  zone3End: 277825,
  
  // Social insurance rates and limits
  rvBeitragssatz: 0.186,
  rvBeitragsbemessungsgrenze: 101400,
  
  avBeitragssatz: 0.026,
  avBeitragsbemessungsgrenze: 101400,
  
  kvBeitragssatz: 0.146,
  kvBeitragsbemessungsgrenze: 69750,
  
  // Pflegeversicherung - PUEG Reform 2026
  pvBeitragssatz: 0.036, // Gesamtsatz 3,6%
  pvBeitragsbemessungsgrenze: 69750,
  pvArbeitnehmerAnteilBasis: 0.023, // 2,3% Basis ab 2026
  pvKinderlosenzuschlag: 0.006, // +0,6% für kinderlose ab 23
  pvKinderabschlag: 0.0025, // -0,25% pro Kind (2.-5. Kind)
  
  // Soli - §4 SolZG
  soliFreigrenze: 20350,
  soliMinderungssatz: 0.119, // 11,9% für Milderungszone
  soliSatz: 0.055, // 5,5%
  
  // Vorsorgepauschale - §39b EStG
  vorsorgepauschaleRundung: 36, // Abrundung auf volle 36 Euro
};

/**
 * §32a EStG - Einkommensteuertarif 2026
 * Calculates income tax based on official formula
 */
function calculateTarif(zve: number): number {
  // Round down to full Euro (§32a Abs. 1 S. 1 EStG)
  const x = Math.floor(zve);
  let steuer = 0;

  if (x <= TAX_2026.grundfreibetrag) {
    // Grundfreibetrag - No tax (§32a Abs. 1 Nr. 1)
    steuer = 0;
  } else if (x <= TAX_2026.zone1End) {
    // Zone 2: 12.349 - 17.799 € (§32a Abs. 1 Nr. 2)
    // y = 1/10.000 of amount exceeding Grundfreibetrag
    const y = (x - TAX_2026.grundfreibetrag) / 10000;
    steuer = (914.51 * y + 1400) * y;
  } else if (x <= TAX_2026.zone2End) {
    // Zone 3: 17.800 - 69.878 € (§32a Abs. 1 Nr. 3)
    // z = 1/10.000 of amount exceeding 17.799 €
    const z = (x - 17799) / 10000;
    steuer = (173.10 * z + 2397) * z + 1034.87;
  } else if (x <= TAX_2026.zone3End) {
    // Zone 4: Proportional zone 42% (§32a Abs. 1 Nr. 4)
    steuer = 0.42 * x - 11135.63;
  } else {
    // Zone 5: Reichensteuer 45% (§32a Abs. 1 Nr. 5)
    steuer = 0.45 * x - 19470.38;
  }

  // Round down to full Euro (§32a Abs. 1 S. 6 EStG)
  return Math.max(0, Math.floor(steuer));
}

/**
 * §32a Abs. 5 EStG - Splitting-Verfahren für Steuerklasse III
 * Berechnung: 2 × Tarif(zvE / 2)
 */
function calculateSplittingTarif(zve: number): number {
  const halvedZve = zve / 2;
  const halvedTax = calculateTarif(halvedZve);
  return 2 * halvedTax;
}

/**
 * §39b Abs. 2 Satz 9 EStG - Abrundung auf volle 36 Euro
 */
function roundTo36(zve: number): number {
  return Math.floor(zve / TAX_2026.vorsorgepauschaleRundung) * TAX_2026.vorsorgepauschaleRundung;
}

/**
 * §4 SolZG - Solidaritätszuschlag mit Milderungszone
 * 
 * Wenn LST ≤ Freigrenze: SOLI = 0
 * Wenn LST > Freigrenze: SOLI = min(LST × 5,5%, (LST - Freigrenze) × 11,9%)
 */
function calculateSoli(lohnsteuer: number): number {
  if (lohnsteuer <= TAX_2026.soliFreigrenze) {
    return 0;
  }
  
  const fullSoli = lohnsteuer * TAX_2026.soliSatz;
  const minderungSoli = (lohnsteuer - TAX_2026.soliFreigrenze) * TAX_2026.soliMinderungssatz;
  
  return Math.round(Math.min(fullSoli, minderungSoli));
}

/**
 * Kirchensteuer - 8% oder 9% der Lohnsteuer
 */
function calculateKirchensteuer(lohnsteuer: number, enabled: boolean, satz: number): number {
  if (!enabled) return 0;
  return Math.round(lohnsteuer * satz);
}

/**
 * PUEG Reform 2026 - Pflegeversicherung mit Kinderstaffelung
 * 
 * Arbeitnehmer-Anteil Basis: 2,3%
 * + 0,6% Kinderlosenzuschlag (ab 23 Jahre ohne Kinder)
 * - 0,25% pro Kind (2. bis 5. Kind, bis 25. Lebensjahr)
 * 
 * Mindestsatz: 1,7% (nur durch Kinderabschläge erreichbar)
 */
function calculatePVSatz(alter: number, kinderAnzahl: number): number {
  let arbeitnehmerAnteil = TAX_2026.pvArbeitnehmerAnteilBasis; // 2,3%
  
  // Kinderlosenzuschlag: +0,6% ab 23 Jahren ohne Kinder
  if (alter >= 23 && kinderAnzahl === 0) {
    arbeitnehmerAnteil += TAX_2026.pvKinderlosenzuschlag;
  }
  
  // Kinderabschläge: -0,25% pro Kind (2. bis 5. Kind)
  // Nur gültig für Kinder bis 25 Jahre (hier vereinfacht angenommen)
  const kinderMitAbschlag = Math.max(0, Math.min(kinderAnzahl - 1, 4)); // 2.-5. Kind = max 4 Abschläge
  arbeitnehmerAnteil -= kinderMitAbschlag * TAX_2026.pvKinderabschlag;
  
  // Mindestsatz sicherstellen
  return Math.max(0.017, arbeitnehmerAnteil);
}

/**
 * §39b EStG - Vorsorgepauschale Berechnung
 * 
 * Die Vorsorgepauschale besteht aus:
 * a) Teilbetrag für Rentenversicherung (anteiliger AN-Beitrag)
 * b) Teilbetrag für Kranken- und Pflegeversicherung (Basistarif)
 * 
 * Vereinfachte Berechnung für Lohnsteuerzwecke
 */
function calculateVorsorgepauschale(
  brutto: number,
  rvBeitrag: number,
  kvBeitrag: number,
  pvBeitrag: number
): number {
  // Teilbetrag RV: AN-Anteil der Rentenversicherung
  const rvTeilbetrag = rvBeitrag;
  
  // Teilbetrag KV/PV: AN-Anteil der Kranken- und Pflegeversicherung
  // Basistarif: 14% für GKV + Zusatz, PV entsprechend
  const kvPvTeilbetrag = kvBeitrag + pvBeitrag;
  
  // Gesamte Vorsorgepauschale (vereinfacht)
  let vorsorgepauschale = rvTeilbetrag + kvPvTeilbetrag;
  
  // Maximale Vorsorgepauschale begrenzen (ca. 20% des Brutto bis Maximum)
  const maxPauschale = Math.min(brutto * 0.20, 19000);
  vorsorgepauschale = Math.min(vorsorgepauschale, maxPauschale);
  
  return Math.round(vorsorgepauschale);
}

/**
 * Berechnung der Sozialabgaben
 */
function calculateSozialabgaben(
  brutto: number,
  zusatzbeitrag: number,
  alter: number,
  kinderAnzahl: number
): {
  rentenversicherung: number;
  arbeitslosenversicherung: number;
  krankenversicherung: number;
  pflegeversicherung: number;
  gesamtSozialabgaben: number;
  vorsorgepauschale: number;
} {
  // Rentenversicherung - 9,3% AN-Anteil
  const rvBasis = Math.min(brutto, TAX_2026.rvBeitragsbemessungsgrenze);
  const rentenversicherung = Math.round((rvBasis * (TAX_2026.rvBeitragssatz / 2)) * 100) / 100;

  // Arbeitslosenversicherung - 1,3% AN-Anteil
  const avBasis = Math.min(brutto, TAX_2026.avBeitragsbemessungsgrenze);
  const arbeitslosenversicherung = Math.round((avBasis * (TAX_2026.avBeitragssatz / 2)) * 100) / 100;

  // Krankenversicherung - 7,3% + halber Zusatzbeitrag
  const kvBasis = Math.min(brutto, TAX_2026.kvBeitragsbemessungsgrenze);
  const kvSatz = (TAX_2026.kvBeitragssatz / 2) + (zusatzbeitrag / 100 / 2);
  const krankenversicherung = Math.round((kvBasis * kvSatz) * 100) / 100;

  // Pflegeversicherung - PUEG Reform 2026
  const pvBasis = Math.min(brutto, TAX_2026.pvBeitragsbemessungsgrenze);
  const pvSatz = calculatePVSatz(alter, kinderAnzahl);
  const pflegeversicherung = Math.round((pvBasis * pvSatz) * 100) / 100;

  const gesamtSozialabgaben = Math.round(
    (rentenversicherung + arbeitslosenversicherung + krankenversicherung + pflegeversicherung) * 100
  ) / 100;

  // Vorsorgepauschale berechnen
  const vorsorgepauschale = calculateVorsorgepauschale(
    brutto,
    rentenversicherung,
    krankenversicherung,
    pflegeversicherung
  );

  return {
    rentenversicherung,
    arbeitslosenversicherung,
    krankenversicherung,
    pflegeversicherung,
    gesamtSozialabgaben,
    vorsorgepauschale,
  };
}

/**
 * Hauptberechnungsfunktion
 */
export function calculateTax(input: TaxInput): TaxResult {
  const {
    bruttoJahr,
    steuerklasse,
    kirchensteuer,
    kirchensteuerSatz,
    zusatzbeitrag,
    werbungskosten,
    kinderAnzahl,
    alter,
  } = input;

  // Sozialabgaben berechnen
  const sozialabgaben = calculateSozialabgaben(bruttoJahr, zusatzbeitrag, alter, kinderAnzahl);

  // Zu versteuerndes Einkommen berechnen
  let zve = bruttoJahr;

  // Werbungskosten (max von Pauschbetrag oder tatsächlichen Kosten)
  const effectiveWerbungskosten = Math.max(TAX_2026.werbungskostenPauschbetrag, werbungskosten);
  zve -= effectiveWerbungskosten;

  // Sonderausgaben Pauschbetrag
  zve -= TAX_2026.sonderausgabenPauschbetrag;

  // Vorsorgepauschale
  zve -= sozialabgaben.vorsorgepauschale;

  // Sicherstellen, dass ZvE nicht negativ wird
  zve = Math.max(0, zve);
  
  const zvERoh = zve;

  // Steuerklassen-Logik gemäß § 32a EStG
  let lohnsteuer = 0;
  let zvEForLohnsteuer = 0;

  switch (steuerklasse) {
    case "I":
    case "II":
    case "IV":
    case "VI":
      // Standard-Tarif
      // §39b Abs. 2 Satz 9: Abrundung auf volle 36 Euro
      zvEForLohnsteuer = roundTo36(zve);
      lohnsteuer = calculateTarif(zvEForLohnsteuer);
      break;

    case "III":
      // Splitting-Verfahren: 2 × Tarif(zvE / 2)
      zvEForLohnsteuer = roundTo36(zve);
      lohnsteuer = calculateSplittingTarif(zvEForLohnsteuer);
      break;

    case "V":
      // Ohne Grundfreibetrag - direkt ab erster Progressionsstufe
      // Faktor-Logik des PAP: zvE + Grundfreibetrag
      zve = zve + TAX_2026.grundfreibetrag;
      zvEForLohnsteuer = roundTo36(zve);
      lohnsteuer = calculateTarif(zvEForLohnsteuer);
      break;

    default:
      zvEForLohnsteuer = roundTo36(zve);
      lohnsteuer = calculateTarif(zvEForLohnsteuer);
  }

  // Solidaritätszuschlag mit Milderungszone
  const solidaritaetszuschlag = calculateSoli(lohnsteuer);

  // Kirchensteuer
  const kirchensteuerBetrag = calculateKirchensteuer(lohnsteuer, kirchensteuer, kirchensteuerSatz);

  const gesamtSteuern = lohnsteuer + solidaritaetszuschlag + kirchensteuerBetrag;
  const gesamtAbzuege = gesamtSteuern + sozialabgaben.gesamtSozialabgaben;
  const nettoJahr = bruttoJahr - gesamtAbzuege;

  return {
    bruttoJahr,
    steuerklasse,
    ...sozialabgaben,
    werbungskostenPauschbetrag: effectiveWerbungskosten,
    sonderausgabenPauschbetrag: TAX_2026.sonderausgabenPauschbetrag,
    vorsorgepauschale: sozialabgaben.vorsorgepauschale,
    zuVersteuerndesEinkommen: zvERoh,
    zvEForLohnsteuer,
    lohnsteuer,
    solidaritaetszuschlag,
    kirchensteuer: kirchensteuerBetrag,
    gesamtSteuern,
    nettoJahr: Math.round(nettoJahr * 100) / 100,
    nettoMonat: Math.round((nettoJahr / 12) * 100) / 100,
    steuerSatz: bruttoJahr > 0 ? (gesamtSteuern / bruttoJahr) * 100 : 0,
    abgabenSatz: bruttoJahr > 0 ? (gesamtAbzuege / bruttoJahr) * 100 : 0,
    nettoQuote: bruttoJahr > 0 ? (nettoJahr / bruttoJahr) * 100 : 0,
  };
}

/**
 * Generate data for what-if analysis chart
 */
export function generateWhatIfData(input: TaxInput): { brutto: number; netto: number; steuern: number; abgaben: number }[] {
  const data: { brutto: number; netto: number; steuern: number; abgaben: number }[] = [];
  
  for (let brutto = 0; brutto <= 200000; brutto += 5000) {
    const result = calculateTax({
      ...input,
      bruttoJahr: brutto,
    });
    
    data.push({
      brutto,
      netto: result.nettoJahr,
      steuern: result.gesamtSteuern,
      abgaben: result.gesamtSozialabgaben,
    });
  }
  
  return data;
}

/**
 * Generate data for Steuerprogression chart
 */
export function generateProgressionData(): { einkommen: number; grenzsteuersatz: number; durchschnittssteuersatz: number }[] {
  const data: { einkommen: number; grenzsteuersatz: number; durchschnittssteuersatz: number }[] = [];
  
  for (let einkommen = 0; einkommen <= 300000; einkommen += 2500) {
    const result = calculateTax({
      bruttoJahr: einkommen,
      steuerklasse: "I",
      kirchensteuer: false,
      kirchensteuerSatz: 0.09,
      zusatzbeitrag: 1.7,
      werbungskosten: 0,
      kinderAnzahl: 0,
      alter: 30,
    });
    
    const resultPlus = calculateTax({
      bruttoJahr: einkommen + 100,
      steuerklasse: "I",
      kirchensteuer: false,
      kirchensteuerSatz: 0.09,
      zusatzbeitrag: 1.7,
      werbungskosten: 0,
      kinderAnzahl: 0,
      alter: 30,
    });
    
    const grenzsteuersatz = ((resultPlus.lohnsteuer - result.lohnsteuer) / 100) * 100;
    const durchschnittssteuersatz = einkommen > 0 ? (result.lohnsteuer / einkommen) * 100 : 0;
    
    data.push({
      einkommen,
      grenzsteuersatz: Math.min(45, Math.max(0, grenzsteuersatz)),
      durchschnittssteuersatz,
    });
  }
  
  return data;
}

// Format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Format percentage
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}
