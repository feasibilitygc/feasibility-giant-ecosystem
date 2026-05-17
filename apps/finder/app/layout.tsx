import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";
import { FgNav } from "@fg/ui";
import "@fg/design-system/src/tokens.css";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-jakarta antialiased bg-[#040D08]`}>
        <Providers>
          <FgNav activeApp="finder" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
