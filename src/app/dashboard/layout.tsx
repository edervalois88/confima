import React from 'react';
import { Bell, PenLine, Search } from 'lucide-react';
import { DashboardNav, DashboardSettingsNav } from '@/presentation/components/DashboardNav';

/**
 * @fileoverview Layout base del Dashboard (Premium Shell).
 * Utiliza PPR para servir el marco de la UI instantáneamente con estética Rich & Premium.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f7f4] flex overflow-hidden text-[#20201d]">
      {/* Sidebar Estática */}
      <aside className="w-72 bg-[#20201d] text-[#d8d3ca] p-6 flex-col hidden md:flex border-r border-[#2d2a26] z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-[#f7f7f4] rounded-md flex items-center justify-center text-[#20201d]">
            <PenLine className="w-5 h-5" />
          </div>
          <span className="text-2xl font-semibold tracking-normal text-white">con Firma</span>
        </div>

        <div className="flex-1">
          <DashboardNav variant="sidebar" />
        </div>

        <div className="mt-auto pt-6 border-t border-[#37332d] space-y-1">
          <DashboardSettingsNav />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative w-full">
        {/* Header Flotante */}
        <header className="min-h-20 bg-white border-b border-[#e3ded5] flex items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-3 md:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#d7d2c8] bg-[#20201d] text-white">
              <PenLine className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold">con Firma</span>
          </div>

          <div className="hidden items-center gap-4 bg-[#f7f7f4] px-4 py-2 rounded-md border border-[#d7d2c8] flex-1 max-w-md focus-within:ring-2 ring-[#7a643d]/20 transition-all sm:flex">
            <Search className="w-4 h-4 text-[#77736b]" />
            <input type="text" placeholder="Buscar invitados, confirmaciones, alergias..." className="bg-transparent border-none focus:outline-none text-sm w-full" />
          </div>

          <div className="flex items-center gap-3 sm:gap-6 sm:ml-4">
            <button className="relative text-[#77736b] hover:text-[#20201d] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#8e3f3f] rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-[#e3ded5]"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden lg:block">
                <div className="text-sm font-bold text-[#20201d] leading-none">Mariana & Roberto</div>
                <div className="text-xs text-[#77736b] mt-1">Boda en configuracion</div>
              </div>
              <button className="w-10 h-10 rounded-md bg-[#eef6f0] text-[#2f6b45] flex items-center justify-center font-bold border border-[#d7d2c8] transition-all">
                MR
              </button>
            </div>
          </div>
        </header>

        <div className="md:hidden border-b border-[#e3ded5] bg-[#fbfaf8]">
          <DashboardNav variant="mobile" />
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto bg-[#f7f7f4] p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
