'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardCheck, Trophy } from 'lucide-react';

const navItems = [
  { href: '/practice', label: 'اختبر نفسك', icon: ClipboardCheck, primary: true },
  { href: '/exam?difficulty=medium', label: 'التحدي اليومي', icon: Trophy },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <header className="border-b border-[#d0d5dd] bg-white">
        <div className="container-ledger py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-11 w-11 overflow-hidden rounded-full border border-[#e7d3ac] bg-white">
                <Image src="/images/smart-logo.png" alt="Smart Financial Solutions" width={44} height={44} className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="brand-title text-base leading-none">Smart Financial Solutions</p>
                <p className="brand-sub">منصة تعليم مهني في المحاسبة والمالية</p>
              </div>
            </Link>

            <nav className="flex flex-wrap items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.href.includes('?') ? pathname.startsWith('/exam') : pathname === item.href;

                if (item.primary) {
                  return (
                    <Link key={item.href} href={item.href} className="btn-primary inline-flex items-center gap-2">
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? 'border-[#0f1f33] bg-[#f6f8fb] text-[#0f1f33]'
                        : 'border-[#d0d5dd] bg-white text-[#344054] hover:border-[#98a2b3]'
                    }`}
                  >
                    <Icon size={15} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
