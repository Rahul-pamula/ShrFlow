import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { ToastProvider } from "@/components/ui";
import { ThemeProvider } from "@/components/ui/ThemeProvider";

// Browser-based font loading to bypass Docker build restrictions
const inter = {
    className: "",
    variable: "--font-inter",
};

export const metadata: Metadata = {
    title: "ShrFlow",
    description: "B2B email marketing and infrastructure platform",
};

import { CaptchaProvider } from "@/context/CaptchaProvider";

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
                        <CaptchaProvider>
                            <ToastProvider>
                                <LayoutWrapper>
                                    {children}
                                </LayoutWrapper>
                            </ToastProvider>
                        </CaptchaProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
