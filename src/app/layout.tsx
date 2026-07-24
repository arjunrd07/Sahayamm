import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/theme-context";
import { AuthProvider } from "@/context/auth-context";
import { NotificationProvider } from "@/context/notification-context";
import { ToastProvider } from "@/components/ui/toast";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-gilroy",
});

export const metadata: Metadata = {
  title: "Sahayam — Internal Lending",
  description: "Intra-organization lending, verification, and agreements — in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable} suppressHydrationWarning>
      <body className={manrope.className} suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <NotificationProvider>{children}</NotificationProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
