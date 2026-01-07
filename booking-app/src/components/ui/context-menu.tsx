'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function ContextMenu({ x, y, isOpen, onClose, children }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y });

  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    // Adjust position if menu would go off screen
    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    // Adjust horizontal position
    if (x + rect.width > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 10;
    }

    // Adjust vertical position
    if (y + rect.height > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 10;
    }

    setAdjustedPosition({ x: Math.max(10, adjustedX), y: Math.max(10, adjustedY) });
  }, [x, y, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menu = (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-clio-gray-900 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl shadow-strong py-1.5 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {children}
    </div>
  );

  return createPortal(menu, document.body);
}

interface ContextMenuItemProps {
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ContextMenuItem({ onClick, icon, children, className = '' }: ContextMenuItemProps) {
  return (
    <button
      className={`w-full text-left px-4 py-2.5 text-sm font-bold uppercase tracking-tight text-clio-gray-600 dark:text-clio-gray-400 hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800 hover:text-clio-blue dark:hover:text-clio-blue flex items-center space-x-3 transition-all ${className}`}
      onClick={onClick}
    >
      {icon && <span className="flex-shrink-0 opacity-70 group-hover:opacity-100">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}