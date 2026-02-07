"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaxProfiles = getTaxProfiles;
exports.getTaxProfileConfig = getTaxProfileConfig;
exports.calculateTax = calculateTax;
exports.generateWhatIfData = generateWhatIfData;
exports.generateProgressionData = generateProgressionData;
exports.formatCurrency = formatCurrency;
exports.formatPercent = formatPercent;
function roundToCents(value) {
    return Math.round(value * 100) / 100;
}
const DEFAULT_TAX_PROFILE = "2026_current";
const TAX_PROFILES = {
    // §32a EStG 2026 (aktuell)
    "2026_current": {
        year: 2026,
        label: "2026 (Aktuell §32a)",
        description: "Aktuelle Tarifwerte 2026.",
        grundfreibetrag: 12348,
        zone1End: 17799,
        zone2End: 69878,
        zone3End: 277825,
        zone2CoeffA: 914.51,
        zone3CoeffA: 173.1,
        zone3Base: 1034.87,
        zone4Offset: 11135.63,
        zone5Offset: 19470.38,
        werbungskostenPauschbetrag: 1230,
        sonderausgabenPauschbetrag: 36,
        entlastungsbetragAlleinerziehende: 4260,
        rvBeitragssatz: 0.186,
        rvBeitragsbemessungsgrenze: 101400,
        avBeitragssatz: 0.026,
        avBeitragsbemessungsgrenze: 101400,
        kvBeitragssatz: 0.146,
        kvBeitragsbemessungsgrenze: 69750,
        pvBeitragssatz: 0.036,
        pvBeitragsbemessungsgrenze: 69750,
        pvArbeitnehmerAnteilBasis: 0.018,
        pvKinderlosenzuschlag: 0.006,
        pvKinderabschlag: 0.0025,
        soliFreigrenze: 20350,
        soliMinderungssatz: 0.119,
        soliSatz: 0.055,
        vorsorgepauschaleRundung: 36,
        stkl5Grenze1: 14071,
        stkl5Grenze2: 34939,
        stkl5Grenze3: 222260,
        avVorsorgeFaktor: 0.235,
    },
    // Kompatibilitätsprofil für ältere externe Rechner
    "2026_legacy": {
        year: 2026,
        label: "2026 (Legacy-Kompatibel)",
        description: "Kompatibilitätsprofil für ältere Vergleichsrechner.",
        grundfreibetrag: 12348,
        zone1End: 17443,
        zone2End: 68480,
        zone3End: 277825,
        zone2CoeffA: 932.3,
        zone3CoeffA: 176.64,
        zone3Base: 1015.13,
        zone4Offset: 10911.92,
        zone5Offset: 19185.88,
        werbungskostenPauschbetrag: 1230,
        sonderausgabenPauschbetrag: 36,
        entlastungsbetragAlleinerziehende: 4260,
        rvBeitragssatz: 0.186,
        rvBeitragsbemessungsgrenze: 101400,
        avBeitragssatz: 0.026,
        avBeitragsbemessungsgrenze: 101400,
        kvBeitragssatz: 0.146,
        kvBeitragsbemessungsgrenze: 69750,
        pvBeitragssatz: 0.036,
        pvBeitragsbemessungsgrenze: 69750,
        pvArbeitnehmerAnteilBasis: 0.018,
        pvKinderlosenzuschlag: 0.006,
        pvKinderabschlag: 0.0025,
        soliFreigrenze: 20350,
        soliMinderungssatz: 0.119,
        soliSatz: 0.055,
        vorsorgepauschaleRundung: 36,
        stkl5Grenze1: 14071,
        stkl5Grenze2: 34939,
        stkl5Grenze3: 222260,
        avVorsorgeFaktor: 0.235,
    },
};
function getTaxProfiles() {
    return Object.keys(TAX_PROFILES).map((id) => ({
        id,
        year: TAX_PROFILES[id].year,
        label: TAX_PROFILES[id].label,
        description: TAX_PROFILES[id].description,
    }));
}
function getTaxProfileConfig(profileId) {
    return TAX_PROFILES[profileId ?? DEFAULT_TAX_PROFILE];
}
/**
 * §32a EStG - Einkommensteuertarif 2026
 * Calculates income tax based on official formula
 */
function calculateTarif(zve, taxConfig) {
    // Round down to full Euro (§32a Abs. 1 S. 1 EStG)
    const x = Math.floor(zve);
    let steuer = 0;
    if (x <= taxConfig.grundfreibetrag) {
        // Grundfreibetrag - No tax (§32a Abs. 1 Nr. 1)
        steuer = 0;
    }
    else if (x <= taxConfig.zone1End) {
        // Zone 2: 12.349 - 17.443 € (§32a Abs. 1 Nr. 2)
        // y = 1/10.000 of amount exceeding Grundfreibetrag
        const y = (x - taxConfig.grundfreibetrag) / 10000;
        steuer = (taxConfig.zone2CoeffA * y + 1400) * y;
    }
    else if (x <= taxConfig.zone2End) {
        // Zone 3: 17.444 - 68.480 € (§32a Abs. 1 Nr. 3)
        // z = 1/10.000 of amount exceeding 17.443 €
        const z = (x - taxConfig.zone1End) / 10000;
        steuer = (taxConfig.zone3CoeffA * z + 2397) * z + taxConfig.zone3Base;
    }
    else if (x <= taxConfig.zone3End) {
        // Zone 4: Proportional zone 42% (§32a Abs. 1 Nr. 4)
        steuer = 0.42 * x - taxConfig.zone4Offset;
    }
    else {
        // Zone 5: Reichensteuer 45% (§32a Abs. 1 Nr. 5)
        steuer = 0.45 * x - taxConfig.zone5Offset;
    }
    // Cent-genaue Ausgabe für Jahresvergleich mit externen Rechnern
    return Math.max(0, roundToCents(steuer));
}
/**
 * §39b Abs. 2 Satz 7 EStG - Spezialtarif für Steuerklassen V und VI
 * Umsetzung gemäß PAP 2026 (MST5-6/UP5-6).
 */
function calculateTarifClassFiveSix(zve, taxConfig) {
    const zzx = Math.floor(zve);
    const zx = Math.min(zzx, taxConfig.stkl5Grenze2);
    let st = calculateUp56(zx, taxConfig);
    if (zzx > taxConfig.stkl5Grenze2) {
        if (zzx > taxConfig.stkl5Grenze3) {
            st = Math.floor(st +
                (taxConfig.stkl5Grenze3 - taxConfig.stkl5Grenze2) * 0.42 +
                (zzx - taxConfig.stkl5Grenze3) * 0.45);
        }
        else {
            st = Math.floor(st + (zzx - taxConfig.stkl5Grenze2) * 0.42);
        }
    }
    if (zzx > taxConfig.stkl5Grenze1) {
        const vergl = st;
        const stAtGrenze1 = calculateUp56(taxConfig.stkl5Grenze1, taxConfig);
        const hoch = Math.floor(stAtGrenze1 + (zzx - taxConfig.stkl5Grenze1) * 0.42);
        st = Math.max(vergl, hoch);
    }
    return Math.max(0, Math.floor(st));
}
function calculateUp56(zx, taxConfig) {
    const st1 = calculateTarif(zx * 1.25, taxConfig);
    const st2 = calculateTarif(zx * 0.75, taxConfig);
    const diff = (st1 - st2) * 2;
    const mist = Math.floor(zx * 0.14);
    return Math.max(diff, mist);
}
/**
 * §32a Abs. 5 EStG - Splitting-Verfahren für Steuerklasse III
 * Berechnung: 2 × Tarif(zvE / 2)
 */
function calculateSplittingTarif(zve, taxConfig) {
    const halvedZve = zve / 2;
    const halvedTax = calculateTarif(halvedZve, taxConfig);
    return roundToCents(2 * halvedTax);
}
/**
 * §39b Abs. 2 Satz 9 EStG - Abrundung auf volle 36 Euro
 */
function roundTo36(zve, taxConfig) {
    return Math.floor(zve / taxConfig.vorsorgepauschaleRundung) * taxConfig.vorsorgepauschaleRundung;
}
/**
 * §4 SolZG - Solidaritätszuschlag mit Milderungszone
 *
 * Wenn LST ≤ Freigrenze: SOLI = 0
 * Wenn LST > Freigrenze: SOLI = min(LST × 5,5%, (LST - Freigrenze) × 11,9%)
 */
function calculateSoli(lohnsteuer, taxConfig) {
    if (lohnsteuer <= taxConfig.soliFreigrenze) {
        return 0;
    }
    const fullSoli = lohnsteuer * taxConfig.soliSatz;
    const minderungSoli = (lohnsteuer - taxConfig.soliFreigrenze) * taxConfig.soliMinderungssatz;
    return roundToCents(Math.min(fullSoli, minderungSoli));
}
/**
 * Kirchensteuer - 8% oder 9% der Lohnsteuer
 */
function calculateKirchensteuer(lohnsteuer, enabled, satz) {
    if (!enabled)
        return 0;
    return roundToCents(lohnsteuer * satz);
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
function calculatePVSatz(alter, kinderAnzahl, taxConfig) {
    let arbeitnehmerAnteil = taxConfig.pvArbeitnehmerAnteilBasis; // 1,8%
    // Kinderlosenzuschlag: +0,6% ab 23 Jahren ohne Kinder
    if (alter >= 23 && kinderAnzahl === 0) {
        arbeitnehmerAnteil += taxConfig.pvKinderlosenzuschlag;
    }
    // Kinderabschläge: -0,25% pro Kind (2. bis 5. Kind)
    // Nur gültig für Kinder bis 25 Jahre (hier vereinfacht angenommen)
    const kinderMitAbschlag = Math.max(0, Math.min(kinderAnzahl - 1, 4)); // 2.-5. Kind = max 4 Abschläge
    arbeitnehmerAnteil -= kinderMitAbschlag * taxConfig.pvKinderabschlag;
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
function calculateVorsorgepauschale(rvBeitrag, avBeitrag, kvBeitrag, pvBeitrag, taxConfig) {
    // Teilbetrag RV: AN-Anteil der Rentenversicherung
    const rvTeilbetrag = rvBeitrag;
    // Teilbetrag ALV: anteilige steuerliche Berücksichtigung im PAP-Kontext
    const avTeilbetrag = avBeitrag * taxConfig.avVorsorgeFaktor;
    // Teilbetrag KV/PV
    const kvPvTeilbetrag = kvBeitrag + pvBeitrag;
    const vorsorgepauschale = rvTeilbetrag + avTeilbetrag + kvPvTeilbetrag;
    return Math.round(vorsorgepauschale);
}
/**
 * Berechnung der Sozialabgaben
 */
function calculateSozialabgaben(brutto, zusatzbeitrag, alter, kinderAnzahl, taxConfig) {
    // Rentenversicherung - 9,3% AN-Anteil
    const rvBasis = Math.min(brutto, taxConfig.rvBeitragsbemessungsgrenze);
    const rentenversicherung = Math.round((rvBasis * (taxConfig.rvBeitragssatz / 2)) * 100) / 100;
    // Arbeitslosenversicherung - 1,3% AN-Anteil
    const avBasis = Math.min(brutto, taxConfig.avBeitragsbemessungsgrenze);
    const arbeitslosenversicherung = Math.round((avBasis * (taxConfig.avBeitragssatz / 2)) * 100) / 100;
    // Krankenversicherung - 7,3% + halber Zusatzbeitrag
    const kvBasis = Math.min(brutto, taxConfig.kvBeitragsbemessungsgrenze);
    const kvSatz = (taxConfig.kvBeitragssatz / 2) + (zusatzbeitrag / 100 / 2);
    const krankenversicherung = Math.round((kvBasis * kvSatz) * 100) / 100;
    // Pflegeversicherung - PUEG Reform 2026
    const pvBasis = Math.min(brutto, taxConfig.pvBeitragsbemessungsgrenze);
    const pvSatz = calculatePVSatz(alter, kinderAnzahl, taxConfig);
    const pflegeversicherung = Math.round((pvBasis * pvSatz) * 100) / 100;
    const gesamtSozialabgaben = Math.round((rentenversicherung + arbeitslosenversicherung + krankenversicherung + pflegeversicherung) * 100) / 100;
    // Vorsorgepauschale berechnen
    const vorsorgepauschale = calculateVorsorgepauschale(rentenversicherung, arbeitslosenversicherung, krankenversicherung, pflegeversicherung, taxConfig);
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
function calculateTax(input) {
    const { bruttoJahr, taxProfileId, steuerklasse, kirchensteuer, kirchensteuerSatz, zusatzbeitrag, werbungskosten, kinderAnzahl, alter, } = input;
    const resolvedTaxProfileId = taxProfileId ?? DEFAULT_TAX_PROFILE;
    const taxConfig = getTaxProfileConfig(resolvedTaxProfileId);
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
    const sozialabgaben = calculateSozialabgaben(bruttoJahr, zusatzbeitrag, alter, kinderAnzahl, taxConfig);
    // Zu versteuerndes Einkommen berechnen
    let zve = bruttoJahr;
    // Werbungskosten und Sonderausgaben gelten in Steuerklassen I bis V
    const effectiveWerbungskosten = steuerklasse === "VI"
        ? 0
        : Math.max(taxConfig.werbungskostenPauschbetrag, werbungskosten);
    zve -= effectiveWerbungskosten;
    const effectiveSonderausgaben = steuerklasse === "VI" ? 0 : taxConfig.sonderausgabenPauschbetrag;
    zve -= effectiveSonderausgaben;
    // Entlastungsbetrag für Steuerklasse II
    if (steuerklasse === "II") {
        zve -= taxConfig.entlastungsbetragAlleinerziehende;
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
            zvEForLohnsteuer = roundTo36(zve, taxConfig);
            lohnsteuer = calculateTarif(zvEForLohnsteuer, taxConfig);
            break;
        case "III":
            // Splitting-Verfahren: 2 × Tarif(zvE / 2)
            zvEForLohnsteuer = roundTo36(zve, taxConfig);
            lohnsteuer = calculateSplittingTarif(zvEForLohnsteuer, taxConfig);
            break;
        case "V":
        case "VI":
            // Spezialtarif für StKl V/VI gemäß §39b Abs. 2 Satz 7
            zvEForLohnsteuer = roundTo36(zve, taxConfig);
            lohnsteuer = calculateTarifClassFiveSix(zvEForLohnsteuer, taxConfig);
            break;
        default:
            zvEForLohnsteuer = roundTo36(zve, taxConfig);
            lohnsteuer = calculateTarif(zvEForLohnsteuer, taxConfig);
    }
    // Solidaritätszuschlag mit Milderungszone
    const solidaritaetszuschlag = calculateSoli(lohnsteuer, taxConfig);
    // Kirchensteuer
    const kirchensteuerBetrag = calculateKirchensteuer(lohnsteuer, kirchensteuer, kirchensteuerSatz);
    const gesamtSteuern = lohnsteuer + solidaritaetszuschlag + kirchensteuerBetrag;
    const gesamtAbzuege = gesamtSteuern + sozialabgaben.gesamtSozialabgaben;
    const nettoJahr = bruttoJahr - gesamtAbzuege;
    return {
        bruttoJahr,
        taxProfileId: resolvedTaxProfileId,
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
function generateWhatIfData(input) {
    const data = [];
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
function generateProgressionData(taxProfileId) {
    const taxConfig = getTaxProfileConfig(taxProfileId);
    const data = [];
    for (let einkommen = 0; einkommen <= 300000; einkommen += 1000) {
        // Calculate tax for this income level
        const result = calculateTax({
            bruttoJahr: einkommen,
            taxProfileId,
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
        if (zve <= taxConfig.grundfreibetrag) {
            // Zone 1: 0%
            grenzsteuersatz = 0;
        }
        else if (zve <= taxConfig.zone1End) {
            // Zone 2: Progressing from ~14% to ~24%
            // Formula: (1864.60 * y + 1400) / 10000 where y = (zvE - GFB) / 10000
            const y = (zve - taxConfig.grundfreibetrag) / 10000;
            grenzsteuersatz = ((2 * taxConfig.zone2CoeffA) * y + 1400) / 100;
        }
        else if (zve <= taxConfig.zone2End) {
            // Zone 3: Progressing from ~24% to ~42%
            // Formula: (353.28 * z + 2397) / 10000 where z = (zvE - 17443) / 10000
            const z = (zve - taxConfig.zone1End) / 10000;
            grenzsteuersatz = ((2 * taxConfig.zone3CoeffA) * z + 2397) / 100;
        }
        else if (zve <= taxConfig.zone3End) {
            // Zone 4: Flat 42%
            grenzsteuersatz = 42;
        }
        else {
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
function formatCurrency(value) {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}
// Format percentage
function formatPercent(value) {
    return new Intl.NumberFormat('de-DE', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(value / 100);
}
