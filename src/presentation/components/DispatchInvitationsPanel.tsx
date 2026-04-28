'use client';

import React, { useActionState } from 'react';
import { CheckCircle2, MessageSquareText, Send, ShieldCheck } from 'lucide-react';
import { dispatchInvitationsAction, DispatchActionState } from '@/presentation/actions/dispatchInvitationActions';

const initialState: DispatchActionState = {
  ok: true,
  message: 'Valida el lote antes de enviar a WhatsApp.',
};

export function DispatchInvitationsPanel() {
  const [state, formAction, isPending] = useActionState(dispatchInvitationsAction, initialState);
  const details = state.result?.details.slice(0, 6) || [];

  return (
    <section className="rounded-lg border border-[#d7d2c8] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold text-[#20201d]">
            <MessageSquareText className="h-5 w-5 text-[#7a643d]" />
            Despacho WhatsApp
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d5a52]">
            Procesa invitados en estado PENDING_SEND usando la plantilla aprobada de Meta y las reglas de opt-in.
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#77736b]">
            Lote
            <input
              name="limit"
              type="number"
              min="1"
              max="100"
              defaultValue="25"
              className="w-20 rounded-md border border-[#d7d2c8] bg-white px-2 py-2 text-sm font-normal normal-case tracking-normal text-[#20201d]"
            />
          </label>
          <button
            type="submit"
            name="mode"
            value="dry-run"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-[#d7d2c8] bg-white px-4 py-2.5 text-sm font-semibold text-[#20201d] transition-colors hover:bg-[#f7f7f4] disabled:opacity-60"
          >
            <ShieldCheck className="h-4 w-4" />
            Validar lote
          </button>
          <button
            type="submit"
            name="mode"
            value="send"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#20201d] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#36332f] disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            Enviar invitaciones
          </button>
        </form>
      </div>

      <div className={`mt-5 rounded-md border px-4 py-3 text-sm ${state.ok ? 'border-[#d7d2c8] bg-[#f7f7f4] text-[#5d5a52]' : 'border-[#e7c6c6] bg-[#f8eeee] text-[#8e3f3f]'}`}>
        {isPending ? 'Procesando lote...' : state.message}
      </div>

      {state.result && (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label={state.result.dryRun ? 'Enviarían' : 'Enviadas'} value={state.result.dryRun ? state.result.skipped : state.result.sent} />
          <Metric label="Bloqueadas" value={state.result.blocked} />
          <Metric label="Fallidas" value={state.result.failed} />
          <Metric label="Candidatas" value={state.result.totalCandidates} />
        </div>
      )}

      {details.length > 0 && (
        <div className="mt-5 divide-y divide-[#ebe7df] rounded-md border border-[#ebe7df]">
          {details.map((detail) => (
            <div key={`${detail.guestId}-${detail.status}`} className="grid gap-2 p-3 text-sm md:grid-cols-[1fr_120px_1.5fr]">
              <div className="font-medium text-[#20201d]">{detail.guestName}</div>
              <div className="flex items-center gap-1 text-xs font-semibold text-[#2f6b45]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {detail.status}
              </div>
              <div className="text-[#5d5a52]">{detail.reason}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[#ebe7df] bg-[#fbfaf8] p-3">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#77736b]">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-[#20201d]">{value}</div>
    </div>
  );
}
