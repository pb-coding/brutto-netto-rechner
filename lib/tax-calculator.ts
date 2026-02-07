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

  // Entlastungsbetrag für Alleinerziehende (Steuerklasse II) - §24b EStG
  entlastungsbetragAlleinerziehende: 4260,
  
  // Tax bracket thresholds (Progressionszonen) - §32a Abs. 1 EStG
  zone1End: 17443,
  zone2End: 68480,
  zone3End: 277825,
  
  // Social insurance rates and limits
  rvBeitragssatz: 0.186,
  rvBeitragsbemessungsgrenze: 101400,
  
  avBeitragssatz: 0.026,
  avBeitragsbemessungsgrenze: 101400,
  
  kvBeitragssatz: 0.146,
  kvBeitragsbemessungsgrenze: 69750,
  
  // Pflegeversicherung - 2026 (offizielle Werte)
  pvBeitragssatz: 0.036, // Gesamtsatz 3,6%
  pvBeitragsbemessungsgrenze: 69750,
  pvArbeitnehmerAnteilBasis: 0.018, // 1,8% AN-Anteil (nicht 2,3% PUEG)
  pvKinderlosenzuschlag: 0.006, // +0,6% für kinderlose ab 23
  pvKinderabschlag: 0.0025, // -0,25% pro Kind (2.-5. Kind)
  
  // Soli - §4 SolZG
  soliFreigrenze: 20350,
  soliMinderungssatz: 0.119, // 11,9% für Milderungszone
  soliSatz: 0.055, // 5,5%
  
  // Vorsorgepauschale - §39b EStG
  vorsorgepauschaleRundung: 36, // Abrundung auf volle 36 Euro

  // Grenzwerte für Steuerklassen V/VI - §39b Abs. 2 Satz 7 EStG / PAP 2026
  stkl5Grenze1: 14071,
  stkl5Grenze2: 34939,
  stkl5Grenze3: 222260,
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
    // Zone 2: 12.349 - 17.443 € (§32a Abs. 1 Nr. 2)
    // y = 1/10.000 of amount exceeding Grundfreibetrag
    const y = (x - TAX_2026.grundfreibetrag) / 10000;
    steuer = (932.30 * y + 1400) * y;
  } else if (x <= TAX_2026.zone2End) {
    // Zone 3: 17.444 - 68.480 € (§32a Abs. 1 Nr. 3)
    // z = 1/10.000 of amount exceeding 17.443 €
    const z = (x - 17443) / 10000;
    steuer = (176.64 * z + 2397) * z + 1015.13;
  } else if (x <= TAX_2026.zone3End) {
    // Zone 4: Proportional zone 42% (§32a Abs. 1 Nr. 4)
    steuer = 0.42 * x - 10911.92;
  } else {
    // Zone 5: Reichensteuer 45% (§32a Abs. 1 Nr. 5)
    steuer = 0.45 * x - 19185.88;
  }

  // Round down to full Euro (§32a Abs. 1 S. 6 EStG)
  return Math.max(0, Math.floor(steuer));
}

/**
 * §39b Abs. 2 Satz 7 EStG - Spezialtarif für Steuerklassen V und VI
 * Umsetzung gemäß PAP 2026 (MST5-6/UP5-6).
 */
function calculateTarifClassFiveSix(zve: number): number {
  const zzx = Math.floor(zve);
  const zx = Math.min(zzx, TAX_2026.stkl5Grenze2);

  let st = calculateUp56(zx);

  if (zzx > TAX_2026.stkl5Grenze2) {
    if (zzx > TAX_2026.stkl5Grenze3) {
      st = Math.floor(
        st +
        (TAX_2026.stkl5Grenze3 - TAX_2026.stkl5Grenze2) * 0.42 +
        (zzx - TAX_2026.stkl5Grenze3) * 0.45
      );
    } else {
      st = Math.floor(st + (zzx - TAX_2026.stkl5Grenze2) * 0.42);
    }
  }

  if (zzx > TAX_2026.stkl5Grenze1) {
    const vergl = st;
    const stAtGrenze1 = calculateUp56(TAX_2026.stkl5Grenze1);
    const hoch = Math.floor(stAtGrenze1 + (zzx - TAX_2026.stkl5Grenze1) * 0.42);
    st = Math.max(vergl, hoch);
  }

  return Math.max(0, Math.floor(st));
}

function calculateUp56(zx: number): number {
  const st1 = calculateTarif(zx * 1.25);
  const st2 = calculateTarif(zx * 0.75);
  const diff = (st1 - st2) * 2;
  const mist = Math.floor(zx * 0.14);
  return Math.max(diff, mist);
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
 * Arbeitnehmer-Anteil Basis: 1,8%
 * + 0,6% Kinderlosenzuschlag (ab 23 Jahre ohne Kinder)
 * - 0,25% pro Kind (2. bis 5. Kind, bis 25. Lebensjahr)
 * 
 * Mindestsatz: 1,7% (nur durch Kinderabschläge erreichbar)
 */
function calculatePVSatz(alter: number, kinderAnzahl: number): number {
  let arbeitnehmerAnteil = TAX_2026.pvArbeitnehmerAnteilBasis; // 1,8%
  
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
  rvBeitrag: number,
  avBeitrag: number,
  kvBeitrag: number,
  pvBeitrag: number
): number {
  // Teilbetrag RV: AN-Anteil der Rentenversicherung
  const rvTeilbetrag = rvBeitrag;

  // Teilbetrag ALV: anteilige steuerliche Berücksichtigung im PAP-Kontext
  const avTeilbetrag = avBeitrag * 0.235;
  
  // Teilbetrag KV/PV
  const kvPvTeilbetrag = kvBeitrag + pvBeitrag;

  const vorsorgepauschale = rvTeilbetrag + avTeilbetrag + kvPvTeilbetrag;
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
    rentenversicherung,
    arbeitslosenversicherung,
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

  if (!Number.isFinite(bruttoJahr) || bruttoJahr < 0) {
    throw new Error("bruttoJahr muss eine nicht-negative Zahl sein.");
  }
  if (!Number.isFinite(zusatzbeitrag) || zusatzbeitrag < 0) {
    throw new Error("zusatzbeitrag muss eine nicht-negative Zahl sein.");
  }
  if (!Number.isFinite(werbungskosten) || werbungskosten < 0) {
    throw new Error("werbungskosten muss eine nicht-negative Zahl sein.");
  }
  if (!Number.isFinite(kinderAnzahl) || kinderAnzahl < 0) {
    throw new Error("kinderAnzahl muss eine nicht-negative Zahl sein.");
  }
  if (!Number.isFinite(alter) || alter < 0) {
    throw new Error("alter muss eine nicht-negative Zahl sein.");
  }

  // Sozialabgaben berechnen
  const sozialabgaben = calculateSozialabgaben(
    bruttoJahr,
    zusatzbeitrag,
    alter,
    kinderAnzahl
  );

  // Zu versteuerndes Einkommen berechnen
  let zve = bruttoJahr;

  // Werbungskosten und Sonderausgaben gelten in Steuerklassen I bis V
  const effectiveWerbungskosten =
    steuerklasse === "VI"
      ? 0
      : Math.max(TAX_2026.werbungskostenPauschbetrag, werbungskosten);
  zve -= effectiveWerbungskosten;

  const effectiveSonderausgaben = steuerklasse === "VI" ? 0 : TAX_2026.sonderausgabenPauschbetrag;
  zve -= effectiveSonderausgaben;

  // Entlastungsbetrag für Steuerklasse II
  if (steuerklasse === "II") {
    zve -= TAX_2026.entlastungsbetragAlleinerziehende;
  }

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
    case "VI":
      // Spezialtarif für StKl V/VI gemäß §39b Abs. 2 Satz 7
      zvEForLohnsteuer = roundTo36(zve);
      lohnsteuer = calculateTarifClassFiveSix(zvEForLohnsteuer);
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
    sonderausgabenPauschbetrag: effectiveSonderausgaben,
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
/**
 * Generate data for Steuerprogression chart
 * Shows marginal and average tax rates
 * 
 * The marginal tax rate (Grenzsteuersatz) is calculated analytically
 * based on the official §32a EStG formula zones for a smooth curve.
 */
export function generateProgressionData(): { einkommen: number; grenzsteuersatz: number; durchschnittssteuersatz: number }[] {
  const data: { einkommen: number; grenzsteuersatz: number; durchschnittssteuersatz: number }[] = [];
  
  for (let einkommen = 0; einkommen <= 300000; einkommen += 1000) {
    // Calculate tax for this income level
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
    
    // Calculate average tax rate
    const durchschnittssteuersatz = einkommen > 0 ? (result.lohnsteuer / einkommen) * 100 : 0;
    
    // Calculate analytical marginal tax rate based on zone
    // This gives the theoretical marginal rate at each point
    let grenzsteuersatz = 0;
    const zve = result.zuVersteuerndesEinkommen;
    
    if (zve <= TAX_2026.grundfreibetrag) {
      // Zone 1: 0%
      grenzsteuersatz = 0;
    } else if (zve <= TAX_2026.zone1End) {
      // Zone 2: Progressing from ~14% to ~24%
      // Formula: (1864.60 * y + 1400) / 10000 where y = (zvE - GFB) / 10000
      const y = (zve - TAX_2026.grundfreibetrag) / 10000;
      grenzsteuersatz = (1864.60 * y + 1400) / 100;
    } else if (zve <= TAX_2026.zone2End) {
      // Zone 3: Progressing from ~24% to ~42%
      // Formula: (353.28 * z + 2397) / 10000 where z = (zvE - 17443) / 10000
      const z = (zve - 17443) / 10000;
      grenzsteuersatz = (353.28 * z + 2397) / 100;
    } else if (zve <= TAX_2026.zone3End) {
      // Zone 4: Flat 42%
      grenzsteuersatz = 42;
    } else {
      // Zone 5: Flat 45%
      grenzsteuersatz = 45;
    }
    
    // Clamp to valid range
    grenzsteuersatz = Math.min(45, Math.max(0, grenzsteuersatz));
    
    data.push({
      einkommen,
      grenzsteuersatz,
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
