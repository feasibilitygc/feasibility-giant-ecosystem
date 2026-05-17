import type { Metadata } from "next";
import { Bebas_Neue, Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "@fg/design-system/src/tokens.css";
import "./globals.css";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Feasibility Giant Company | Engineering Africa's Digital Infrastructure",
  description: "Advanced Engineering, Environmental Simulation, and Finance SaaS Solutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${bebas.variable} ${syne.variable} ${dmSans.variable} ${jetbrains.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
