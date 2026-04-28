'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bot, Briefcase, LayoutDashboard, Settings, ShieldAlert, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const primaryItems = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/dashboard/guests', label: 'Invitados', icon: Users },
  { href: '/dashboard/ai', label: 'Asistente WA', icon: Bot },
];

const secondaryItems = [
  { href: '/dashboard/vendors', label: 'Proveedores', icon: Briefcase },
  { href: '/dashboard/compliance', label: 'Compliance', icon: ShieldAlert },
  { href: '/dashboard/settings', label: 'Ajustes', icon: Settings },
];

interface DashboardNavProps {
  variant: 'sidebar' | 'mobile';
}

export function DashboardNav({ variant }: DashboardNavProps) {
  const pathname = usePathname();
  const items = variant === 'mobile' ? [...primaryItems, ...secondaryItems] : primaryItems;

  if (variant === 'mobile') {
    return (
      <nav className="flex gap-2 overflow-x-auto px-4 py-3">
        {items.map(item => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} variant="mobile" />
        ))}
      </nav>
    );
  }

  return (
    <>
      <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8f887d]">
        Operacion
      </div>
      <nav className="space-y-1">
        {primaryItems.map(item => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} variant="sidebar" />
        ))}
      </nav>

      <div className="mb-4 mt-8 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8f887d]">
        Adicionales
      </div>
      <nav className="space-y-1">
        {secondaryItems.slice(0, 2).map(item => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} variant="sidebar" />
        ))}
      </nav>
    </>
  );
}

export function DashboardSettingsNav() {
  const pathname = usePathname();
  const item = secondaryItems[2];
  return <NavLink item={item} active={isActive(pathname, item.href)} variant="sidebar" />;
}

function NavLink({
  item,
  active,
  variant,
}: {
  item: { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
  active: boolean;
  variant: DashboardNavProps['variant'];
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'relative flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors',
        variant === 'sidebar' && 'px-3 py-2.5',
        variant === 'mobile' && 'min-w-fit border border-[#d7d2c8] bg-white px-3 py-2 text-[#5d5a52]',
        variant === 'sidebar' && (active ? 'text-white' : 'text-[#d8d3ca] hover:bg-white/5 hover:text-white'),
        variant === 'mobile' && active && 'border-[#20201d] text-[#20201d]'
      )}
    >
      {active && (
        <motion.span
          layoutId={`dashboard-nav-active-${variant}`}
          className={cn(
            'absolute inset-0 rounded-md',
            variant === 'sidebar' ? 'bg-white/10' : 'bg-[#f7f7f4]'
          )}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        />
      )}
      <Icon className={cn('relative h-4 w-4', active ? 'text-current' : 'text-[#8f887d]')} />
      <span className="relative whitespace-nowrap">{item.label}</span>
    </Link>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
