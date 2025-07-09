import './globals.css';
import '../styles/global.css';
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { auth } from "@/lib/auth";
import AuthProvider from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body>
        <AuthProvider session={session}>
          <Providers>{children}</Providers>
        </AuthProvider>
      </body>
    </html>
  );
}