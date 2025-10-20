import type { Metadata, Viewport } from "next";
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
  title: "AI-Learning",
  description:
    "An interactive learning platform that converts PDFs or text into flashcards, quizzes, and short tests.",
  keywords: [
    "AI",
    "learning",
    "flashcards",
    "quizzes",
    "tests",
    "education",
    "Next.js",
    "FastAPI",
  ],
  authors: [{ name: "Aiden Carrera" }],
  openGraph: {
    title: "AI-Learning",
    description:
      "Upload PDFs or text and generate flashcards, quizzes, and tests instantly — a full-stack AI-powered learning app.",
    url: "http://localhost:3000",
    siteName: "AI-Learning",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f2937", // dark gray
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-900 text-white min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
