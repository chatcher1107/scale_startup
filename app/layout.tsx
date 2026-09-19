import type { Metadata } from "next";
import { Carlito, Fraunces } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { TourProvider } from "@/components/Tour";

const carlito = Carlito({ variable: "--font-carlito", subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Seasoned: Ready before the rush",
  description: "AI frontline readiness for restaurant groups.",
  icons: { icon: "/seasoned-logo.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${carlito.variable} ${fraunces.variable} h-full`}>
      <body className="min-h-full">
        <StoreProvider>
          <TourProvider>{children}</TourProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
