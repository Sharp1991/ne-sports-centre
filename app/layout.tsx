import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ne-sports-centre.vercel.app"),
  title: {
    default: "Highland Football — Football, Stories & Data",
    template: "%s | Highland Football",
  },
  description:
    "Highland Football brings football stories, news, match results, standings, players, competitions, and football data from Meghalaya and Northeast India.",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "Highland Football",
    "Northeast India football",
    "Meghalaya football",
    "Shillong football",
    "football news",
    "football results",
    "football standings",
    "football statistics",
  ],
  openGraph: {
    title: "Highland Football — Football, Stories & Data",
    description:
      "Football stories, news, match results, standings, players, competitions, and football data from Meghalaya and Northeast India.",
    url: "https://ne-sports-centre.vercel.app",
    siteName: "Highland Football",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Highland Football",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Highland Football — Football, Stories & Data",
    description:
      "Football stories, news, match results, standings, players, competitions, and football data from Meghalaya and Northeast India.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
