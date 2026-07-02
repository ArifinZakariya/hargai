import { ThemeProvider } from "next-themes";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

export const metadata = {
  title: "ProcureAI - Cari & Bandingkan Harga",
  description: "Scrape produk dari Shopee & Tokopedia, bandingkan harga, temukan yang termurah.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
