import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Shell } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nautilus NoteDesk",
  description:
    "Nautilus Builders job-site note analyzer. Capture handwritten site notes, upload photos, and get clean, structured text.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <div className="min-h-screen flex flex-col bg-background">
          <header className="border-b border-border/40 bg-[#15486b] text-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center rounded-full bg-white h-8 w-8 shadow-sm text-[#f7941d]">
                  <Shell className="h-4 w-4" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold tracking-tight">
                    Nautilus NoteDesk
                  </span>
                  <span className="text-[11px] text-white/70">
                    Internal · PM tools
                  </span>
                </div>
              </div>
              <div className="text-xs text-white/70 hidden sm:block">
                Job-site notes → structured text
              </div>
            </div>
          </header>
          <div className="flex-1 flex flex-col">{children}</div>
        </div>
      </body>
    </html>
  );
}
