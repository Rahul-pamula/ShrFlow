import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { ToastProvider } from "@/components/ui";
import { ThemeProvider } from "@/components/ui/ThemeProvider";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "ShrFlow",
    description: "B2B email marketing and infrastructure platform",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        /*
         * suppressHydrationWarning: next-themes writes `class` and `style`
         * attributes on <html> on the client to avoid a flash of wrong theme.
         * Without this flag, React will warn about the server/client mismatch.
         */
        <html lang="en" className={inter.variable} suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider>
                    <AuthProvider>
                        <ToastProvider>
                            <LayoutWrapper>
                                {children}
                            </LayoutWrapper>
                        </ToastProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
