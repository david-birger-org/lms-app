import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

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
  title: "LMS Admin",
  description: "Protected admin workspace for payment operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} theme-default antialiased`}
      >
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#111111",
              colorBackground: "#fafafa",
              colorInputBackground: "#ffffff",
              colorInputText: "#111111",
              colorText: "#111111",
              colorTextSecondary: "#666666",
              colorNeutral: "#e5e5e5",
              borderRadius: "10px",
            },
          }}
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
