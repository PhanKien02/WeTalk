import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { ImageLightboxProvider } from "@/components/ui/image-lightbox";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: "WeTalk — Modern Chat App",
  description: "Clean, responsive chat web app UI built with Next.js and Tailwind CSS",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    siteName: "WeTalk",
    title: "WeTalk — Modern Chat App",
    description: "Nhắn tin nhanh, bảo mật và đẹp mắt cho mọi đội nhóm.",
    locale: "vi_VN",
  },
  twitter: {
    card: "summary_large_image",
    title: "WeTalk — Modern Chat App",
    description: "Nhắn tin nhanh, bảo mật và đẹp mắt cho mọi đội nhóm.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground overflow-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <AuthProvider>
              <ImageLightboxProvider>{children}</ImageLightboxProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
