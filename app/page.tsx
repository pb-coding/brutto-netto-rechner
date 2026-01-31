"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calculateTax,
  generateWhatIfData,
  generateProgressionData,
  formatCurrency,
  formatPercent,
  TaxInput,
  Steuerklasse,
} from "@/lib/tax-calculator";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  BarChart,
  Bar,
  ComposedChart,
} from "recharts";
import {
  Calculator,
  TrendingUp,
  PiggyBank,
  Wallet,
  Percent,
  Euro,
  Building2,
  HeartPulse,
  Shield,
  Baby,
  Briefcase,
  Info,
} from "lucide-react";

const steuerklasseOptions: { value: Steuerklasse; label: string; description: string }[] = [
  { value: "I", label: "Steuerklasse I", description: "Alleinstehend / Ledig / Geschieden" },
  { value: "II", label: "Steuerklasse II", description: "Alleinerziehend" },
  { value: "III", label: "Steuerklasse III", description: "Verheiratet (höherer Verdienst)" },
  { value: "IV", label: "Steuerklasse IV", description: "Verheiratet (ähnliches Einkommen)" },
  { value: "V", label: "Steuerklasse V", description: "Verheiratet (geringerer Verdienst)" },
  { value: "VI", label: "Steuerklasse VI", description: "Nebenjob / Zweitarbeitsverhältnis" },
];

export default function TaxDashboard() {
  // Input states
  const [bruttoJahr, setBruttoJahr] = useState<number>(60000);
  const [steuerklasse, setSteuerklasse] = useState<Steuerklasse>("I");
  const [kirchensteuer, setKirchensteuer] = useState<boolean>(false);
  const [kirchensteuerSatz, setKirchensteuerSatz] = useState<number>(9);
  const [zusatzbeitrag, setZusatzbeitrag] = useState<number>(1.70);
  const [werbungskosten, setWerbungskosten] = useState<number>(0);

  // Calculate tax result
  const taxInput: TaxInput = useMemo(
    () => ({
      bruttoJahr,
      steuerklasse,
      kirchensteuer,
      kirchensteuerSatz: kirchensteuerSatz / 100,
      zusatzbeitrag,
      werbungskosten,
    }),
    [bruttoJahr, steuerklasse, kirchensteuer, kirchensteuerSatz, zusatzbeitrag, werbungskosten]
  );

  const taxResult = useMemo(() => calculateTax(taxInput), [taxInput]);
  const whatIfData = useMemo(() => generateWhatIfData(taxInput), [taxInput]);
  const progressionData = useMemo(() => generateProgressionData(), []);

  // Format numbers
  const formatNumber = (num: number) => new Intl.NumberFormat("de-DE").format(num);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-xl">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Lohnsteuer Rechner 2026</h1>
                <p className="text-sm text-zinc-400">Berechnung nach deutschem EStG</p>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm text-zinc-400">Steuerjahr</p>
              <p className="text-lg font-bold text-blue-400">2026</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Inputs */}
          <div className="lg:col-span-4 space-y-6">
            {/* Brutto Input */}
            <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Euro className="h-5 w-5 text-blue-400" />
                  Bruttoeinkommen
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Ihr jährliches Bruttoeinkommen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Input
                    type="number"
                    value={bruttoJahr}
                    onChange={(e) => setBruttoJahr(Number(e.target.value))}
                    className="bg-zinc-950 border-zinc-700 text-white text-lg font-mono h-14 pl-4 pr-12"
                    placeholder="60000"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">
                    €
                  </span>
                </div>
                <Slider
                  value={[bruttoJahr]}
                  onValueChange={([value]) => setBruttoJahr(value)}
                  min={0}
                  max={200000}
                  step={1000}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>0 €</span>
                  <span>100.000 €</span>
                  <span>200.000 €</span>
                </div>
                <div className="pt-2 border-t border-zinc-800">
                  <p className="text-sm text-zinc-400">
                    Monatlich: {" "}
                    <span className="text-white font-medium">{formatCurrency(bruttoJahr / 12)}</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Steuerklasse */}
            <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Briefcase className="h-5 w-5 text-blue-400" />
                  Steuerklasse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={steuerklasse} onValueChange={(v) => setSteuerklasse(v as Steuerklasse)}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {steuerklasseOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-white hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-zinc-400">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Kirchensteuer */}
            <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Building2 className="h-5 w-5 text-blue-400" />
                  Kirchensteuer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="kirchensteuer" className="text-zinc-300">
                    Kirchensteuerpflichtig
                  </Label>
                  <Switch
                    id="kirchensteuer"
                    checked={kirchensteuer}
                    onCheckedChange={setKirchensteuer}
                  />
                </div>
                {kirchensteuer && (
                  <div className="pt-2 border-t border-zinc-800 space-y-2">
                    <Label className="text-zinc-400 text-sm">Kirchensteuersatz</Label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setKirchensteuerSatz(8)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          kirchensteuerSatz === 8
                            ? "bg-blue-600 text-white"
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                        }`}
                      >
                        8% (BY/BW)
                      </button>
                      <button
                        onClick={() => setKirchensteuerSatz(9)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          kirchensteuerSatz === 9
                            ? "bg-blue-600 text-white"
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                        }`}
                      >
                        9% (Rest)
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Krankenversicherung Zusatzbeitrag */}
            <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <HeartPulse className="h-5 w-5 text-blue-400" />
                  KV Zusatzbeitrag
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Zusätzlicher Beitragssatz Ihrer Krankenkasse
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-400">
                    {zusatzbeitrag.toFixed(2)}%
                  </span>
                  <span className="text-sm text-zinc-500">Durchschnitt: 1,70%</span>
                </div>
                <Slider
                  value={[zusatzbeitrag]}
                  onValueChange={([value]) => setZusatzbeitrag(value)}
                  min={0}
                  max={3}
                  step={0.01}
                />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>0,00%</span>
                  <span>1,50%</span>
                  <span>3,00%</span>
                </div>
              </CardContent>
            </Card>

            {/* Werbungskosten */}
            <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Briefcase className="h-5 w-5 text-blue-400" />
                  Werbungskosten
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Tatsächliche Kosten über Pauschbetrag hinaus
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Input
                    type="number"
                    value={werbungskosten}
                    onChange={(e) => setWerbungskosten(Number(e.target.value))}
                    className="bg-zinc-950 border-zinc-700 text-white font-mono h-12 pl-4 pr-12"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">
                    €
                  </span>
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-zinc-400">
                      Arbeitnehmer-Pauschbetrag 2026: <span className="text-zinc-300 font-medium">1.230 €</span>
                      <br />
                      Höherer Wert (tatsächliche Kosten) wird automatisch angewendet
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-8 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-sm text-zinc-400 mb-1">Brutto / Jahr</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(taxResult.bruttoJahr)}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {formatCurrency(taxResult.bruttoJahr / 12)} / Monat
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-sm text-zinc-400 mb-1">Steuern</p>
                  <p className="text-xl font-bold text-red-400">{formatCurrency(taxResult.gesamtSteuern)}</p>
                  <p className="text-xs text-zinc-500 mt-1">{formatPercent(taxResult.steuerSatz)}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-sm text-zinc-400 mb-1">Sozialabgaben</p>
                  <p className="text-xl font-bold text-orange-400">
                    {formatCurrency(taxResult.gesamtSozialabgaben)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {formatPercent((taxResult.gesamtSozialabgaben / taxResult.bruttoJahr) * 100)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-900/30 to-zinc-900 border-blue-800/50">
                <CardContent className="p-4">
                  <p className="text-sm text-blue-300 mb-1">Netto / Jahr</p>
                  <p className="text-xl font-bold text-blue-400">{formatCurrency(taxResult.nettoJahr)}</p>
                  <p className="text-xs text-blue-300/70 mt-1">
                    {formatCurrency(taxResult.nettoMonat)} / Monat
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Breakdown */}
            <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Wallet className="h-5 w-5 text-blue-400" />
                  Detaillierte Aufschlüsselung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Steuern Section */}
                  <div className="p-4 bg-zinc-800/50 rounded-xl">
                    <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-red-400" />
                      Steuern
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-zinc-500">Lohnsteuer</p>
                        <p className="text-lg font-semibold text-white">{formatCurrency(taxResult.lohnsteuer)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Solidaritätszuschlag</p>
                        <p className="text-lg font-semibold text-white">
                          {formatCurrency(taxResult.solidaritaetszuschlag)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Kirchensteuer</p>
                        <p className="text-lg font-semibold text-white">
                          {formatCurrency(taxResult.kirchensteuer)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Gesamt</p>
                        <p className="text-lg font-semibold text-red-400">{formatCurrency(taxResult.gesamtSteuern)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Sozialabgaben Section */}
                  <div className="p-4 bg-zinc-800/50 rounded-xl">
                    <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-orange-400" />
                      Sozialabgaben
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-zinc-500">Rentenversicherung</p>
                        <p className="text-lg font-semibold text-white">
                          {formatCurrency(taxResult.rentenversicherung)}
                        </p>
                        <p className="text-xs text-zinc-600">9,3%</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Krankenversicherung</p>
                        <p className="text-lg font-semibold text-white">
                          {formatCurrency(taxResult.krankenversicherung)}
                        </p>
                        <p className="text-xs text-zinc-600">{(7.3 + zusatzbeitrag / 2).toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Pflegeversicherung</p>
                        <p className="text-lg font-semibold text-white">
                          {formatCurrency(taxResult.pflegeversicherung)}
                        </p>
                        <p className="text-xs text-zinc-600">2,4% (kindlos)</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Arbeitslosenvers.</p>
                        <p className="text-lg font-semibold text-white">
                          {formatCurrency(taxResult.arbeitslosenversicherung)}
                        </p>
                        <p className="text-xs text-zinc-600">1,3%</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Gesamt</p>
                        <p className="text-lg font-semibold text-orange-400">
                          {formatCurrency(taxResult.gesamtSozialabgaben)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Taxable Income */}
                  <div className="p-4 bg-zinc-800/50 rounded-xl">
                    <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                      <Percent className="h-4 w-4 text-blue-400" />
                      Zu versteuerndes Einkommen
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-zinc-500">Bruttoeinkommen</p>
                        <p className="text-lg font-semibold text-white">{formatCurrency(taxResult.bruttoJahr)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Werbungskosten</p>
                        <p className="text-lg font-semibold text-red-300">
                          -{formatCurrency(taxResult.werbungskostenPauschbetrag)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Sonderausgaben</p>
                        <p className="text-lg font-semibold text-red-300">
                          -{formatCurrency(taxResult.sonderausgabenPauschbetrag)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Vorsorgepauschale</p>
                        <p className="text-lg font-semibold text-red-300">
                          -{formatCurrency(taxResult.vorsorgepauschale)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">ZvE (für Lohnsteuer)</p>
                        <p className="text-lg font-semibold text-blue-400">
                          {formatCurrency(taxResult.zuVersteuerndesEinkommen)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-gradient-to-r from-blue-900/20 to-zinc-900 border border-blue-800/30 rounded-xl">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-zinc-400">Nettoquote</p>
                        <p className="text-2xl font-bold text-blue-400">{formatPercent(taxResult.nettoQuote)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Gesamtbelastung</p>
                        <p className="text-2xl font-bold text-red-400">{formatPercent(taxResult.abgabenSatz)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-zinc-400">Netto jährlich / monatlich</p>
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(taxResult.nettoJahr)}</p>
                        <p className="text-lg text-green-400/80">{formatCurrency(taxResult.nettoMonat)} / Monat</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <Tabs defaultValue="whatif" className="w-full">
              <TabsList className="bg-zinc-900 border border-zinc-800 w-full">
                <TabsTrigger value="whatif" className="data-[state=active]:bg-blue-600 flex-1">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  What-If Analyse
                </TabsTrigger>
                <TabsTrigger value="progression" className="data-[state=active]:bg-blue-600 flex-1">
                  <Percent className="h-4 w-4 mr-2" />
                  Steuerprogression
                </TabsTrigger>
              </TabsList>

              <TabsContent value="whatif" className="mt-4">
                <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white">What-If Analyse</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Vergleichen Sie Nettoeinkommen bei verschiedenen Bruttolöhnen
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={whatIfData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorNetto" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorSteuern" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorAbgaben" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis
                            dataKey="brutto"
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            stroke="#71717a"
                          />
                          <YAxis
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            stroke="#71717a"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#18181b",
                              border: "1px solid #27272a",
                              borderRadius: "8px",
                            }}
                            labelStyle={{ color: "#a1a1aa" }}
                            itemStyle={{ color: "#e4e4e7" }}
                            formatter={(value) => typeof value === 'number' ? formatCurrency(value) : value}
                            labelFormatter={(label) => `Brutto: ${formatCurrency(label as number)}`}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="netto"
                            name="Netto"
                            stroke="#3b82f6"
                            fillOpacity={1}
                            fill="url(#colorNetto)"
                            strokeWidth={2}
                          />
                          <Area
                            type="monotone"
                            dataKey="steuern"
                            name="Steuern"
                            stroke="#ef4444"
                            fillOpacity={1}
                            fill="url(#colorSteuern)"
                            strokeWidth={2}
                          />
                          <Area
                            type="monotone"
                            dataKey="abgaben"
                            name="Sozialabgaben"
                            stroke="#f97316"
                            fillOpacity={1}
                            fill="url(#colorAbgaben)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progression" className="mt-4">
                <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white">Steuerprogression 2026</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Grenzsteuersatz und Durchschnittssteuersatz nach Einkommen
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={progressionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis
                            dataKey="einkommen"
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            stroke="#71717a"
                          />
                          <YAxis
                            tickFormatter={(value) => `${value.toFixed(0)}%`}
                            stroke="#71717a"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#18181b",
                              border: "1px solid #27272a",
                              borderRadius: "8px",
                            }}
                            labelStyle={{ color: "#a1a1aa" }}
                            itemStyle={{ color: "#e4e4e7" }}
                            formatter={(value) => typeof value === 'number' ? `${value.toFixed(2)}%` : value}
                            labelFormatter={(label) => `Einkommen: ${formatCurrency(label as number)}`}
                          />
                          <Legend />
                          <Area
                            type="stepAfter"
                            dataKey="grenzsteuersatz"
                            name="Grenzsteuersatz"
                            stroke="#8b5cf6"
                            fill="#8b5cf6"
                            fillOpacity={0.1}
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="durchschnittssteuersatz"
                            name="Durchschnittssteuersatz"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={false}
                          />
                          {/* Reference lines for tax brackets */}
                          <Line
                            type="monotone"
                            dataKey={() => 14}
                            stroke="#52525b"
                            strokeDasharray="5 5"
                            dot={false}
                            legendType="none"
                            hide
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="p-3 bg-zinc-800/50 rounded-lg">
                        <p className="text-zinc-500">Grundfreibetrag</p>
                        <p className="text-white font-medium">12.348 €</p>
                        <p className="text-xs text-zinc-600">0% Steuer</p>
                      </div>
                      <div className="p-3 bg-zinc-800/50 rounded-lg">
                        <p className="text-zinc-500">Zone 1 Ende</p>
                        <p className="text-white font-medium">17.799 €</p>
                        <p className="text-xs text-zinc-600">bis ~14% Grenzsteuer</p>
                      </div>
                      <div className="p-3 bg-zinc-800/50 rounded-lg">
                        <p className="text-zinc-500">Spitzensteuersatz</p>
                        <p className="text-white font-medium">69.878 €</p>
                        <p className="text-xs text-zinc-600">42% Grenzsteuer</p>
                      </div>
                      <div className="p-3 bg-zinc-800/50 rounded-lg">
                        <p className="text-zinc-500">Reichensteuer</p>
                        <p className="text-white font-medium">277.826 €</p>
                        <p className="text-xs text-zinc-600">45% Grenzsteuer</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-zinc-800 text-center">
          <p className="text-sm text-zinc-500">
            Berechnung nach §32a EStG für das Steuerjahr 2026. Alle Angaben ohne Gewähr.
          </p>
          <p className="text-xs text-zinc-600 mt-2">
            Die Berechnung dient als Orientierung. Für verbindliche Auskünfte konsultieren Sie einen Steuerberater.
          </p>
        </footer>
      </main>
    </div>
  );
}
