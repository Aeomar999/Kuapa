import type { Metadata } from "next";
// Canonical typefaces — mirror apps/mobile (Raleway heading / Nunito body).
import { Nunito, Raleway } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
});

const raleway = Raleway({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kuapa Admin · Farm to Market",
  description: "Admin dashboard for Kuapa platform — Farm to Market",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${raleway.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
