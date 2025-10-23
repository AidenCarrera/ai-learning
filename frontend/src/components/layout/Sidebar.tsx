"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Library,
  PlusCircle,
  Settings,
  Menu,
  X,
  BookOpen,
} from "lucide-react";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}

const navItems: NavItem[] = [
    {
        href: "/",
        icon: Home,
        label: "Home",
        description: "Dashboard and overview",
    },
    {
        href: "/library",
        icon: Library,
        label: "Library",
        description: "Browse your card sets",
    },
    {
        href: "/generate",
        icon: PlusCircle,
        label: "Generate",
        description: "Create new flashcards",
    },
];

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const pathname = usePathname();

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        )}
      </button>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? 280 : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 overflow-hidden`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo / Brand */}
          <div className="mb-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Learning
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Smart Flashcards
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200 group
                    ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "text-white" : "text-gray-500 dark:text-gray-400"
                    }`}
                  />
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        isActive ? "text-white" : ""
                      }`}
                    >
                      {item.label}
                    </p>
                    <p
                      className={`text-xs ${
                        isActive
                          ? "text-blue-100"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Settings at Bottom */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="font-medium">Settings</span>
            </Link>
          </div>

          {/* Toggle Button (Desktop) */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center w-8 h-8 mt-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Menu className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </motion.aside>

      {/* Overlay for Mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}