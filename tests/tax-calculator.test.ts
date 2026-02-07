import test from "node:test";
import assert from "node:assert/strict";

import { calculateTax, Steuerklasse } from "../lib/tax-calculator";

function runScenario(bruttoJahr: number, steuerklasse: Steuerklasse) {
  return calculateTax({
    bruttoJahr,
    steuerklasse,
    kirchensteuer: false,
    kirchensteuerSatz: 0.09,
    zusatzbeitrag: 2.9,
    werbungskosten: 0,
    kinderAnzahl: steuerklasse === "II" ? 1 : 0,
    alter: 30,
  });
}

test("BMF PAP 2026 Prüftabelle: 20.000 EUR", () => {
  const expected: Record<Steuerklasse, number> = {
    I: 380,
    II: 0,
    III: 0,
    IV: 380,
    V: 2234,
    VI: 2766,
  };

  (Object.keys(expected) as Steuerklasse[]).forEach((stkl) => {
    const actual = runScenario(20000, stkl).lohnsteuer;
    const tolerance = stkl === "V" || stkl === "VI" ? 450 : 160;
    assert.ok(Math.abs(actual - expected[stkl]) <= tolerance, `StKl ${stkl}: ${actual} vs ${expected[stkl]}`);
  });
});

test("BMF PAP 2026 Prüftabelle: 50.000 EUR", () => {
  const expected: Record<Steuerklasse, number> = {
    I: 6788,
    II: 5580,
    III: 2810,
    IV: 6788,
    V: 12010,
    VI: 12542,
  };

  (Object.keys(expected) as Steuerklasse[]).forEach((stkl) => {
    const actual = runScenario(50000, stkl).lohnsteuer;
    const tolerance = stkl === "V" || stkl === "VI" ? 450 : 160;
    assert.ok(Math.abs(actual - expected[stkl]) <= tolerance, `StKl ${stkl}: ${actual} vs ${expected[stkl]}`);
  });
});

test("BMF PAP 2026 Prüftabelle: 100.000 EUR", () => {
  const expected: Record<Steuerklasse, number> = {
    I: 23248,
    II: 21634,
    III: 15012,
    IV: 23248,
    V: 30157,
    VI: 30689,
  };

  (Object.keys(expected) as Steuerklasse[]).forEach((stkl) => {
    const actual = runScenario(100000, stkl).lohnsteuer;
    const tolerance = stkl === "V" || stkl === "VI" ? 450 : 180;
    assert.ok(Math.abs(actual - expected[stkl]) <= tolerance, `StKl ${stkl}: ${actual} vs ${expected[stkl]}`);
  });
});

test("Steuerklasse VI nutzt keine ANP/SAP-Abzuege", () => {
  const result = runScenario(50000, "VI");
  assert.equal(result.werbungskostenPauschbetrag, 0);
  assert.equal(result.sonderausgabenPauschbetrag, 0);
});

test("Steuerklasse II entlastet gegenueber Steuerklasse I", () => {
  const stklI = runScenario(50000, "I");
  const stklII = runScenario(50000, "II");
  assert.ok(stklII.lohnsteuer < stklI.lohnsteuer);
});

test("Negative Eingaben werfen einen Fehler", () => {
  assert.throws(() =>
    calculateTax({
      bruttoJahr: -1,
      steuerklasse: "I",
      kirchensteuer: false,
      kirchensteuerSatz: 0.09,
      zusatzbeitrag: 2.9,
      werbungskosten: 0,
      kinderAnzahl: 0,
      alter: 30,
    })
  );
});
