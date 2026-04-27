import React from 'react';
import { Users, Filter, Download } from 'lucide-react';
import { GuestTable } from '@/presentation/components/GuestTable';
import { Skeleton } from '@/presentation/components/Skeleton';
import { Suspense } from 'react';
import { PrismaClient } from '@prisma/client';
import { GuestDirectoryService } from '@/application/services/GuestDirectoryService';

const prisma = new PrismaClient();

export default function GuestsPage() {
  return (
    <div className="space-y-8 fade-in">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-500" /> Directorio de Invitados
          </h2>
          <p className="text-slate-500 text-lg">Administra RSVPs, requerimientos especiales y mesas.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filtrar
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 flex items-center gap-2">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl border shadow-sm p-2">
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
