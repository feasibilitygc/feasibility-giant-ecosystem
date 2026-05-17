import { Rajdhani, Barlow } from "next/font/google";
import { Providers } from "./providers";
import { FgNav } from "@fg/ui";
import "@fg/design-system/src/tokens.css";
import "./globals.css";

const rajdhani = Rajdhani({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-rajdhani" });
const barlow = Barlow({ weight: ["300", "400", "600"], subsets: ["latin"], variable: "--font-barlow" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${rajdhani.variable} ${barlow.variable} font-barlow antialiased bg-[#030608]`}>
        <Providers>
          <FgNav activeApp="threed" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
