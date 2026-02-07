import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lohnsteuer Rechner 2026 | Deutsches Steuerberechnung",
  description: "Berechnen Sie Ihre deutsche Lohnsteuer für 2026. Inklusive Sozialabgaben, Kirchensteuer, Solidaritätszuschlag und Steuerklassen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
