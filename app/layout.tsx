import "./globals.css";
import "react-quill-new/dist/quill.snow.css";
import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import Providers from "@/components/providers";

// Font configurations
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: "100",
});

export const metadata: Metadata = {
  title: {
    default:
      "T.I.P. ETEEAP - Expanded Tertiary Education Equivalency Program",
    template: "%s | T.I.P. ETEEAP",
  },
  description:
    "Transform your professional experience into academic credentials through T.I.P.'s Expanded Tertiary Education Equivalency and Accreditation Program (ETEEAP).",
  keywords: [
    "ETEEAP",
    "T.I.P.",
    "Technological Institute of the Philippines",
    "degree completion",
    "working professionals",
  ],
  openGraph: {
    type: "website",
    url: "https://tip-eteeap.edu.ph",
    siteName: "T.I.P. ETEEAP",
    title: "T.I.P. ETEEAP - Transform Experience into Academic Credentials",
    description:
      "Get your bachelor's degree through T.I.P.'s ETEEAP program for working professionals.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "T.I.P. ETEEAP Program",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "T.I.P. ETEEAP - Transform Experience into Academic Credentials",
    description:
      "Get your bachelor's degree through T.I.P.'s ETEEAP program for working professionals.",
    images: ["/twitter-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className={`${inter.className} antialiased bg-gray-900 text-white overflow-x-hidden`}
      >
        {/* Skip link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-yellow-400 text-black px-4 py-2 rounded-lg z-50 font-semibold"
        >
          Skip to main content
        </a>

        {/* Wrap everything with Providers so NextAuth works */}
        <Providers>
          <main id="main-content" className="min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
