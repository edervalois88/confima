import React from 'react';
import { Users, Filter, Download } from 'lucide-react';
import { GuestTable } from '@/presentation/components/GuestTable';
import { Skeleton } from '@/presentation/components/Skeleton';
import { Suspense } from 'react';
import { GuestDirectoryService } from '@/application/services/GuestDirectoryService';
import { prisma } from '@/infrastructure/database/prisma';

export default function GuestsPage() {
  return (
    <div className="space-y-8 fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="flex items-center gap-3 text-3xl font-semibold tracking-normal text-[#20201d]">
            <Users className="h-7 w-7 text-[#7a643d]" /> Directorio de Invitados
          </h2>
          <p className="max-w-2xl text-base leading-7 text-[#5d5a52]">Administra RSVPs, requerimientos especiales y mesas.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 rounded-md border border-[#d7d2c8] bg-white px-4 py-2 text-sm font-semibold text-[#20201d] hover:bg-[#f7f7f4]">
            <Filter className="w-4 h-4" /> Filtrar
          </button>
          <button className="flex items-center gap-2 rounded-md bg-[#20201d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#36332f]">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </header>

      <div className="rounded-lg border border-[#d7d2c8] bg-white p-2 shadow-sm">
        <Suspense fallback={<Skeleton className="h-[600px] rounded-xl" />}>
          <GuestsTableFromDatabase />
        </Suspense>
      </div>
    </div>
  );
}

async function GuestsTableFromDatabase() {
  const directory = new GuestDirectoryService(prisma);
  const guests = await directory.listGuests();

  return <GuestTable guests={guests} />;
}
