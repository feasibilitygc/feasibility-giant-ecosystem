import { Fraunces, DM_Sans } from "next/font/google";
import { Providers } from "./providers";
import { FgNav } from "@fg/ui";
import "@fg/design-system/src/tokens.css";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${fraunces.variable} ${dmSans.variable} font-dm-sans antialiased bg-[#06090F]`}>
        <Providers>
          <FgNav activeApp="finance" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
