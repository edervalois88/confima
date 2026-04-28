import React, { Suspense } from "react";
import { AlertCircle, CheckCircle2, MessageSquareText, UploadCloud, Users } from "lucide-react";
import { GuestTable } from "@/presentation/components/GuestTable";
import { Skeleton } from "@/presentation/components/Skeleton";
import { StreamingPlanner } from "@/presentation/components/StreamingPlanner";
import { DispatchInvitationsPanel } from "@/presentation/components/DispatchInvitationsPanel";
import { GuestDirectoryService, RsvpSummary } from "@/application/services/GuestDirectoryService";
import { prisma } from "@/infrastructure/database/prisma";

export default function DashboardPage() {
  return (
    <div className="space-y-8 pb-16">
      <header className="flex flex-col gap-4 border-b border-[#d7d2c8] pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7a643d]">Backoffice de invitaciones</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-normal text-[#20201d]">con Firma</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#5d5a52]">
            Prioridad operativa: cargar invitados, enviar invitaciones, responder dudas por WhatsApp y registrar confirmaciones o necesidades especiales.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 self-start rounded-md bg-[#20201d] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#36332f]">
          <UploadCloud className="h-4 w-4" />
          Cargar lista
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Suspense fallback={<Skeleton className="h-32 rounded-md" />}>
          <RSVPSummaryCardsFromDatabase />
        </Suspense>
      </div>

      <DispatchInvitationsPanel />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#20201d]">
              <Users className="h-5 w-5 text-[#7a643d]" />
              Invitados y confirmaciones
            </h3>
          </div>
          <div className="rounded-lg border border-[#d7d2c8] bg-white p-4 shadow-sm">
            <Suspense fallback={<Skeleton className="h-[400px] rounded-md" />}>
              <GuestTableFromDatabase />
            </Suspense>
          </div>
        </section>

        <aside className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[#20201d]">
            <MessageSquareText className="h-5 w-5 text-[#2f6b45]" />
            Asistente de evento
          </h3>
          <div className="rounded-lg border border-[#d7d2c8] bg-white p-5 shadow-sm">
            <StreamingPlanner />
          </div>
        </aside>
      </div>
    </div>
  );
}

async function GuestTableFromDatabase() {
  const directory = new GuestDirectoryService(prisma);
  const guests = await directory.listGuests(12);

  return <GuestTable guests={guests} />;
}

async function RSVPSummaryCardsFromDatabase() {
  const directory = new GuestDirectoryService(prisma);
  const summary = await directory.getSummary();

  return <RSVPSummaryCards summary={summary} />;
}

function RSVPSummaryCards({ summary }: { summary: RsvpSummary }) {
  return (
    <>
      <SummaryCard
        icon={<CheckCircle2 className="h-5 w-5" />}
        label="Confirmados"
        value={String(summary.confirmed)}
        detail="Registrados en BD"
        tone="green"
      />
      <SummaryCard
        icon={<Users className="h-5 w-5" />}
        label="Pendientes"
        value={String(summary.pending)}
        detail="Recordatorio listo"
        tone="gold"
      />
      <SummaryCard
        icon={<AlertCircle className="h-5 w-5" />}
        label="Necesidades especiales"
        value={String(summary.specialNeeds)}
        detail="Menu o accesibilidad"
        tone="red"
      />
    </>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "green" | "gold" | "red";
}) {
  const toneClass = {
    green: "text-[#2f6b45] bg-[#eef6f0]",
    gold: "text-[#7a643d] bg-[#f5f0e7]",
    red: "text-[#8e3f3f] bg-[#f8eeee]",
  }[tone];

  return (
    <div className="rounded-lg border border-[#d7d2c8] bg-white p-5 shadow-sm">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-md ${toneClass}`}>
        {icon}
      </div>
      <div className="text-sm font-semibold uppercase tracking-[0.12em] text-[#77736b]">{label}</div>
      <div className="mt-2 text-4xl font-semibold text-[#20201d]">{value}</div>
      <div className="mt-2 text-sm text-[#5d5a52]">{detail}</div>
    </div>
  );
}
