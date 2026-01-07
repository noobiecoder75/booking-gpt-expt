'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <Link
            href="/dashboard/quotes"
            className="text-clio-gray-500 hover:text-clio-gray-700 dark:text-clio-gray-400 dark:hover:text-white transition-colors"
          >
            <Home className="w-4 h-4" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="w-4 h-4 text-clio-gray-400 dark:text-clio-gray-600 mx-2" />
            {item.href ? (
              <Link
                href={item.href}
                className="text-clio-gray-500 hover:text-clio-gray-700 dark:text-clio-gray-400 dark:hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-clio-gray-900 dark:text-white font-bold uppercase tracking-tight text-xs">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}