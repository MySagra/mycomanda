import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { EnvProviderWrapper } from "@/components/providers/EnvProviderWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyComanda",
  description: "MySagra - MyComanda",
  applicationName: "MyComanda",
  appleWebApp: {
    capable: true,
    title: "MyComanda",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <EnvProviderWrapper>
              {children}
            </EnvProviderWrapper>
            <Toaster position="top-center" offset="6px" />
            <ServiceWorkerRegister />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
