"use client";

import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Consistent page wrapper for all routes
 * Provides spacing, title, and optional action button
 */
export default function PageContainer({
  children,
  title,
  description,
  action,
}: PageContainerProps) {
  return (
    <div className="min-h-screen">
      {/* Header Section */}
      {(title || description || action) && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {title && (
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {title}
              </h1>
            )}
            {action && <div>{action}</div>}
          </div>
          {description && (
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
}