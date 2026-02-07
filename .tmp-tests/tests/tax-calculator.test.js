"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const tax_calculator_1 = require("../lib/tax-calculator");
function runScenario(bruttoJahr, steuerklasse) {
    return (0, tax_calculator_1.calculateTax)({
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
(0, node_test_1.default)("BMF PAP 2026 Prüftabelle: 20.000 EUR", () => {
    const expected = {
        I: 380,
        II: 0,
        III: 0,
        IV: 380,
        V: 2234,
        VI: 2766,
    };
    Object.keys(expected).forEach((stkl) => {
        const actual = runScenario(20000, stkl).lohnsteuer;
        const tolerance = stkl === "V" || stkl === "VI" ? 450 : 160;
        strict_1.default.ok(Math.abs(actual - expected[stkl]) <= tolerance, `StKl ${stkl}: ${actual} vs ${expected[stkl]}`);
    });
});
(0, node_test_1.default)("BMF PAP 2026 Prüftabelle: 50.000 EUR", () => {
    const expected = {
        I: 6788,
        II: 5580,
        III: 2810,
        IV: 6788,
        V: 12010,
        VI: 12542,
    };
    Object.keys(expected).forEach((stkl) => {
        const actual = runScenario(50000, stkl).lohnsteuer;
        const tolerance = stkl === "V" || stkl === "VI" ? 450 : 160;
        strict_1.default.ok(Math.abs(actual - expected[stkl]) <= tolerance, `StKl ${stkl}: ${actual} vs ${expected[stkl]}`);
    });
});
(0, node_test_1.default)("BMF PAP 2026 Prüftabelle: 100.000 EUR", () => {
    const expected = {
        I: 23248,
        II: 21634,
        III: 15012,
        IV: 23248,
        V: 30157,
        VI: 30689,
    };
    Object.keys(expected).forEach((stkl) => {
        const actual = runScenario(100000, stkl).lohnsteuer;
        const tolerance = stkl === "V" || stkl === "VI" ? 450 : 180;
        strict_1.default.ok(Math.abs(actual - expected[stkl]) <= tolerance, `StKl ${stkl}: ${actual} vs ${expected[stkl]}`);
    });
});
(0, node_test_1.default)("Steuerklasse VI nutzt keine ANP/SAP-Abzuege", () => {
    const result = runScenario(50000, "VI");
    strict_1.default.equal(result.werbungskostenPauschbetrag, 0);
    strict_1.default.equal(result.sonderausgabenPauschbetrag, 0);
});
(0, node_test_1.default)("Steuerklasse II entlastet gegenueber Steuerklasse I", () => {
    const stklI = runScenario(50000, "I");
    const stklII = runScenario(50000, "II");
    strict_1.default.ok(stklII.lohnsteuer < stklI.lohnsteuer);
});
(0, node_test_1.default)("Negative Eingaben werfen einen Fehler", () => {
    strict_1.default.throws(() => (0, tax_calculator_1.calculateTax)({
        bruttoJahr: -1,
        steuerklasse: "I",
        kirchensteuer: false,
        kirchensteuerSatz: 0.09,
        zusatzbeitrag: 2.9,
        werbungskosten: 0,
        kinderAnzahl: 0,
        alter: 30,
    }));
});
