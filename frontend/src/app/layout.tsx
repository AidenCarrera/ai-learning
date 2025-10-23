import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { CardSetsProvider } from "@/contexts/CardSetsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Learning - Smart Flashcards",
  description:
    "An interactive learning platform that converts PDFs or text into flashcards, quizzes, and short tests using AI.",
  keywords: [
    "AI",
    "learning",
    "flashcards",
    "quizzes",
    "tests",
    "education",
    "Next.js",
    "FastAPI",
    "study tools",
    "AI flashcards",
  ],
  authors: [{ name: "Aiden Carrera" }],
  openGraph: {
    title: "AI Learning - Smart Flashcards",
    description:
      "Upload PDFs or text and generate flashcards, quizzes, and tests instantly — a full-stack AI-powered learning app.",
    url: "http://localhost:3000",
    siteName: "AI Learning",
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
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CardSetsProvider>
          <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-[280px] p-6 md:p-10 transition-all duration-300">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </CardSetsProvider>
      </body>
    </html>
  );
}