import "@/styles/globals.css";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Wrapper, WrapperWithQuery } from "@/components/wrapper";
import { Geist, Geist_Mono } from "next/font/google";
import { TRPCReactProvider } from "@/trpc/react";
import { createMetadata } from "@/lib/metadata";

//TODO make a choice between server components with/without react-query or TRPC with react-query

export const metadata = createMetadata({
  title: {
    template: "%s | Better Auth",
    default: "Better Auth",
  },
  description: "The most comprehensive authentication library for typescript",
  metadataBase: new URL("https://demo.better-auth.com"),
});

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable}`}>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <Wrapper>
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </Wrapper>
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
