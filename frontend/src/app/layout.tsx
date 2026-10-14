import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadFlow | Wealth Advisor CRM - Pravar AI",
  description: "AI-Augmented Lead & Client Engagement Platform for Wealth Advisors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="min-h-full font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
