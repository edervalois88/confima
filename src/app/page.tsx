import type React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageSquareText, PenLine, UploadCloud } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#20201d]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#2d2a26] bg-[#20201d] text-white">
            <PenLine className="h-5 w-5" />
          </div>
          <span className="text-2xl font-semibold tracking-normal">con Firma</span>
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-md border border-[#20201d] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#20201d] hover:text-white"
        >
          Abrir backoffice
          <ArrowRight className="h-4 w-4" />
        </Link>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-12 lg:grid-cols-[1fr_440px] lg:items-end lg:pt-24">
        <div className="max-w-3xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#7a643d]">
            Invitaciones inteligentes para bodas
          </p>
          <h1 className="text-5xl font-semibold leading-tight tracking-normal text-[#20201d] md:text-7xl">
            con Firma
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5d5a52]">
            Carga tu lista de invitados, envia invitaciones por WhatsApp y deja que un asistente
            responda dudas basicas del evento mientras actualiza confirmaciones y necesidades especiales.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard/guests"
              className="inline-flex items-center gap-2 rounded-md bg-[#20201d] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#36332f]"
            >
              Gestionar invitados
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 rounded-md border border-[#c8c2b8] bg-white px-5 py-3 text-sm font-semibold text-[#20201d] transition-colors hover:border-[#20201d]"
            >
              Configurar WhatsApp
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-[#d7d2c8] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-[#ebe7df] pb-4">
            <div>
              <p className="text-sm font-semibold text-[#20201d]">Flujo principal</p>
              <p className="text-xs text-[#77736b]">Mariana & Roberto</p>
            </div>
            <span className="rounded-md bg-[#eef6f0] px-3 py-1 text-xs font-semibold text-[#2f6b45]">
              Activo
            </span>
          </div>
          <div className="space-y-3">
            <FlowStep icon={<UploadCloud className="h-4 w-4" />} label="Lista cargada" value="200 invitados" />
            <FlowStep icon={<MessageSquareText className="h-4 w-4" />} label="Invitaciones enviadas" value="142 entregadas" />
            <FlowStep icon={<CheckCircle2 className="h-4 w-4" />} label="Confirmaciones" value="87 confirmados" />
          </div>
        </div>
      </section>
    </main>
  );
}

function FlowStep({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-[#ebe7df] p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#f7f7f4] text-[#7a643d]">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-[#20201d]">{label}</p>
        <p className="text-sm text-[#77736b]">{value}</p>
      </div>
    </div>
  );
}
