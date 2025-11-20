import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "~/lib/trpc/Provider";
import { SessionProvider } from "~/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: "研究生智能助理",
  description: "Graduate Assistant - 智能課程與學習管理系統",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="antialiased font-sans">
        <SessionProvider>
          <TRPCProvider>{children}</TRPCProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
