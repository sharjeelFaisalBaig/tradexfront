import "./globals.css";
import "../styles/global.css";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { auth } from "@/lib/auth";
import AuthProvider from "@/context/AuthContext";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tradex Ai",
  description:
    "AI-powered trading assistant to make smarter investment decisions.",
  openGraph: {
    title: "Tradex Ai",
    description:
      "AI-powered trading assistant to make smarter investment decisions.",
    url: "https://tradexfront-xi.vercel.app",
    siteName: "Tradex Ai",
    images: [
      {
        url: "https://tradexfront-xi.vercel.app/og-logo-1200x630.png",
        width: 1200,
        height: 630,
        alt: "Tradex Ai Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tradex Ai",
    description:
      "AI-powered trading assistant to make smarter investment decisions.",
    images: ["https://tradexfront-xi.vercel.app/og-logo-1200x630.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider session={session}>
          <Providers>{children}</Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
