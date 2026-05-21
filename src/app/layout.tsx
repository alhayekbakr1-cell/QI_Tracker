import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import MsalWrapper from "@/components/MsalWrapper";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "QI Project Tracker | AdventHealth",
  description: "Secure, role-based QI project tracking dashboard.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  referrer: "same-origin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="bg-slate-50 min-h-screen flex flex-col font-sans antialiased text-slate-900">
        <MsalWrapper>
          <AppShell>
            {children}
          </AppShell>
        </MsalWrapper>
        <footer className="py-6 border-t bg-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm text-slate-500">
              IM Resident QI Project Tracker &copy; {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
